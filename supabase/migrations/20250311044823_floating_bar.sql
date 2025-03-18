/*
  # Initial Schema Setup for WhatsApp Business App

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `phone_number` (text, unique)
      - `name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chats`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, references contacts)
      - `message` (text)
      - `direction` (text, either 'incoming' or 'outgoing')
      - `status` (text, either 'sent', 'delivered', or 'read')
      - `message_id` (text, nullable, for WhatsApp reference)
      - `metadata` (jsonb, nullable, for additional message data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `configurations`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (text, nullable)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create contacts table
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chats table
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  message text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  status text NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
  message_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create configurations table
CREATE TABLE configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access to authenticated users" ON contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON chats
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON configurations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default configurations
INSERT INTO configurations (key, description) VALUES
  ('TOKEN_META', 'WhatsApp Business API Token'),
  ('API', 'WhatsApp API URL'),
  ('TOKEN_CHATGPT', 'OpenAI API Key for AI Assistant');