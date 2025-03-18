/*
  # Add message_id to chats table

  1. Changes
    - Add `message_id` column to `chats` table to store WhatsApp message IDs
  
  2. Purpose
    - This allows us to track message status updates from WhatsApp
    - We can match incoming status updates with our stored messages
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'message_id'
  ) THEN
    ALTER TABLE chats ADD COLUMN message_id text;
    CREATE INDEX IF NOT EXISTS idx_chats_message_id ON chats(message_id);
  END IF;
END $$;