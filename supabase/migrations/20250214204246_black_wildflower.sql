/*
  # Add chat and contact management

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `phone_number` (text, unique)
      - `name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chats`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key)
      - `message` (text)
      - `direction` (enum: 'incoming', 'outgoing')
      - `status` (enum: 'sent', 'delivered', 'read')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

-- Create enum types
CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  message text NOT NULL,
  direction message_direction NOT NULL,
  status message_status DEFAULT 'sent',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for chats
CREATE POLICY "Users can read chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage chats"
  ON chats
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_chats_contact ON chats(contact_id);
CREATE INDEX IF NOT EXISTS idx_chats_created ON chats(created_at);