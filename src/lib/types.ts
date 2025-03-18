export interface Configuration {
  id: string;
  key: string;
  value: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  event: string;
  entry: string | null;
  output_text: string | null;
  return_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  row_number: number;
  date_time: string;
  phone_number: string;
  customer_name: string | null;
  products: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trace {
  id: string;
  uuid: string;
  phone_number: string;
  start_date: string | null;
  end_date: string | null;
  logs: Record<string, any> | null;
  created_at: string;
}

export interface Contact {
  id: string;
  phone_number: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  contact_id: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'delivered' | 'read';
  message_id?: string; // WhatsApp message ID for reference
  created_at: string;
  updated_at: string;
}