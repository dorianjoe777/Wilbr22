/*
  # Initial Schema Setup for WhatsApp Business App

  1. New Tables
    - `configurations`
      - Stores API tokens and configuration settings
      - Similar to the "Configuracion" sheet
      
    - `conversations`
      - Stores conversation flow definitions
      - Similar to the "Conversacion" sheet
      
    - `requests`
      - Stores customer requests/orders
      - Similar to the "Solicitud" sheet
      
    - `traces`
      - Stores conversation traces and logs
      - Similar to the "Trazabilidad" sheet

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Configurations table
CREATE TABLE IF NOT EXISTS configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read configurations"
  ON configurations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update configurations"
  ON configurations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  entry text,
  output_text text,
  return_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage conversations"
  ON conversations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_number SERIAL,
  date_time timestamptz DEFAULT now(),
  phone_number text NOT NULL,
  customer_name text,
  products text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert requests"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Traces table
CREATE TABLE IF NOT EXISTS traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid text NOT NULL,
  phone_number text NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  logs jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read traces"
  ON traces
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert traces"
  ON traces
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_event ON conversations(event);
CREATE INDEX IF NOT EXISTS idx_requests_phone_number ON requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_traces_phone_number ON traces(phone_number);
CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key);