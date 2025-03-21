import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Chat, Contact } from './types';

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface WhatsAppContact {
  wa_id: string;
  profile?: {
    name?: string;
  };
}

export interface MessageValue {
  messages?: WhatsAppMessage[];
  contacts?: WhatsAppContact[];
  statuses?: Array<{
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
  }>;
}

export interface WhatsAppChange {
  value: MessageValue;
  field: string;
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppWebhook {
  object: string;
  entry: WhatsAppEntry[];
}

interface ProcessResult {
  success: boolean;
  error?: unknown;
}

async function sendWhatsAppMessage(phoneNumber: string, message: string, supabase: SupabaseClient<Database>) {
  const { data: configs } = await supabase
    .from('configurations')
    .select('key, value')
    .in('key', ['API', 'ACCESS_TOKEN']);

  if (!configs) {
    throw new Error('WhatsApp configuration not found');
  }

  const configMap = configs.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);

  if (!configMap.API || !configMap.ACCESS_TOKEN) {
    throw new Error('WhatsApp API URL or access token not configured');
  }

  const response = await fetch(configMap.API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${configMap.ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
  }

  return response.json();
}

async function getChatGPTResponse(message: string, supabase: SupabaseClient<Database>) {
  const { data: config } = await supabase
    .from('configurations')
    .select('value, key')
    .in('key', ['TOKEN_CHATGPT', 'MODELO_CHATGPT', 'Entrenamiento'])
    .execute();

  if (!config || config.length === 0) {
    throw new Error('ChatGPT configuration not found');
  }

  const configMap = config.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as Record<string, string>);

  if (!configMap.TOKEN_CHATGPT) {
    throw new Error('OpenAI API key not configured');
  }

  const payload = {
    messages: [
      { role: "system", content: configMap.Entrenamiento || '' },
      { role: "user", content: message }
    ],
    model: configMap.MODELO_CHATGPT || 'gpt-4',
    temperature: 0,
    max_tokens: 2048,
    presence_penalty: 0,
    frequency_penalty: 0,
    top_p: 1,
    stop: "\\n"
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${configMap.TOKEN_CHATGPT}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const json = await response.json();
  
  if (json.choices && json.choices[0].message && json.choices[0].message.content) {
    return json.choices[0].message.content.trim();
  }
  
  throw new Error('Invalid response from OpenAI API');
}

export async function processWebhookEvent(
  event: WhatsAppWebhook,
  supabase: SupabaseClient<Database>
): Promise<ProcessResult> {
  try {
    if (event.object !== 'whatsapp_business_account') {
      return { success: false, error: 'Invalid webhook object type' };
    }

    for (const entry of event.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await processMessages(change.value, supabase);
        } else if (change.field === 'message_status') {
          await processStatusUpdates(change.value, supabase);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return { success: false, error };
  }
}

async function processMessages(
  value: MessageValue,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const messages = value.messages || [];
  const contacts = value.contacts || [];

  for (const message of messages) {
    try {
      // Get or create contact
      const contact = await getOrCreateContact(message.from, contacts, supabase);
      if (!contact) continue;

      // Store the incoming message
      const { data: chatMessage } = await supabase
        .from('chats')
        .insert([{
          contact_id: contact.id,
          message: message.text?.body || '',
          direction: 'incoming',
          status: 'delivered',
          message_id: message.id,
          metadata: {
            timestamp: message.timestamp,
            type: message.type
          }
        }])
        .select()
        .single();

      if (!chatMessage) throw new Error('Failed to store incoming message');

      // Get ChatGPT response
      const gptResponse = await getChatGPTResponse(message.text?.body || '', supabase);

      // Send response via WhatsApp
      await sendWhatsAppMessage(contact.phone_number, gptResponse, supabase);

      // Store the outgoing message
      await supabase
        .from('chats')
        .insert([{
          contact_id: contact.id,
          message: gptResponse,
          direction: 'outgoing',
          status: 'sent',
          metadata: {
            timestamp: new Date().toISOString(),
            type: 'text'
          }
        }]);

    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
    }
  }
}

async function getOrCreateContact(
  phoneNumber: string,
  contacts: WhatsAppContact[],
  supabase: SupabaseClient<Database>
): Promise<Contact | null> {
  try {
    // Try to find existing contact
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingContact) {
      // Update contact name if we received it from WhatsApp
      const whatsappContact = contacts.find(c => c.wa_id === phoneNumber);
      if (whatsappContact?.profile?.name && !existingContact.name) {
        await supabase
          .from('contacts')
          .update({ name: whatsappContact.profile.name })
          .eq('id', existingContact.id);
        return { ...existingContact, name: whatsappContact.profile.name };
      }
      return existingContact;
    }

    // Create new contact
    const whatsappContact = contacts.find(c => c.wa_id === phoneNumber);
    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert([{
        phone_number: phoneNumber,
        name: whatsappContact?.profile?.name || null
      }])
      .select()
      .single();

    if (error) throw error;
    return newContact;
  } catch (error) {
    console.error('Error in getOrCreateContact:', error);
    return null;
  }
}

async function processStatusUpdates(
  value: MessageValue,
  supabase: SupabaseClient<Database>
): Promise<void> {
  const statuses = value.statuses || [];

  for (const status of statuses) {
    try {
      await supabase
        .from('chats')
        .update({ 
          status: status.status as Chat['status'],
          updated_at: new Date().toISOString()
        })
        .eq('message_id', status.id);
    } catch (error) {
      console.error(`Error processing status update for message ${status.id}:`, error);
    }
  }
}