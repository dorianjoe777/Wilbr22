import { supabase } from './supabase';
import type { Chat, Contact } from './types';

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  video?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  audio?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  document?: {
    id: string;
    mime_type: string;
    sha256: string;
    filename: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    phones: Array<{ phone: string }>;
    name: {
      first_name: string;
      last_name?: string;
    };
  }>;
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

/**
 * Process incoming webhook events from WhatsApp Business API
 */
export async function processWebhookEvent(event: WhatsAppWebhook): Promise<ProcessResult> {
  try {
    if (event.object !== 'whatsapp_business_account') {
      return { success: false, error: 'Invalid webhook object type' };
    }

    for (const entry of event.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await processMessages(change.value);
        } else if (change.field === 'message_status') {
          await processStatusUpdates(change.value);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return { success: false, error };
  }
}

/**
 * Process incoming messages
 */
async function processMessages(value: MessageValue): Promise<void> {
  const messages = value.messages || [];
  const contacts = value.contacts || [];

  for (const message of messages) {
    try {
      // Get or create contact
      const contact = await getOrCreateContact(message.from, contacts);
      if (!contact) continue;

      // Process the message based on its type
      const messageContent = await extractMessageContent(message);
      
      // Store the message
      await supabase.from('chats').insert([{
        contact_id: contact.id,
        message: messageContent,
        direction: 'incoming' as const,
        status: 'delivered' as const,
        message_id: message.id,
        metadata: {
          type: message.type,
          timestamp: message.timestamp,
          raw: message
        }
      }]);

      console.log(`Processed ${message.type} message from ${message.from}`);
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
    }
  }
}

/**
 * Get or create a contact from the WhatsApp message
 */
async function getOrCreateContact(
  phoneNumber: string,
  contacts: WhatsAppContact[]
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

/**
 * Extract readable content from different message types
 */
async function extractMessageContent(message: WhatsAppMessage): Promise<string> {
  switch (message.type) {
    case 'text':
      return message.text?.body || '[Empty message]';
    
    case 'image':
      return message.image?.caption || '[Image]';
    
    case 'video':
      return message.video?.caption || '[Video]';
    
    case 'audio':
      return '[Audio message]';
    
    case 'document':
      return `[Document: ${message.document?.filename || 'Untitled'}]${
        message.document?.caption ? ` - ${message.document.caption}` : ''
      }`;
    
    case 'location':
      if (message.location) {
        const parts = [];
        if (message.location.name) parts.push(message.location.name);
        if (message.location.address) parts.push(message.location.address);
        parts.push(`(${message.location.latitude}, ${message.location.longitude})`);
        return `[Location: ${parts.join(' - ')}]`;
      }
      return '[Location]';
    
    case 'contacts':
      if (message.contacts && message.contacts.length > 0) {
        const contactNames = message.contacts.map(contact => 
          `${contact.name.first_name} ${contact.name.last_name || ''}`
        );
        return `[Contacts: ${contactNames.join(', ')}]`;
      }
      return '[Contacts]';
    
    default:
      return `[${message.type} message]`;
  }
}

/**
 * Process message status updates
 */
async function processStatusUpdates(value: MessageValue): Promise<void> {
  const statuses = value.statuses || [];

  for (const status of statuses) {
    try {
      // Find the message in our database using the WhatsApp message ID
      const { data: message } = await supabase
        .from('chats')
        .select('id')
        .eq('message_id', status.id)
        .single();

      if (!message) continue;

      // Update the message status
      let newStatus: Chat['status'] = 'sent';
      if (status.status === 'delivered') newStatus = 'delivered';
      if (status.status === 'read') newStatus = 'read';

      await supabase
        .from('chats')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', message.id);

      console.log(`Updated status for message ${status.id} to ${newStatus}`);
    } catch (error) {
      console.error(`Error processing status update for message ${status.id}:`, error);
    }
  }
}