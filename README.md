# WhatsApp Business App

A web application for managing WhatsApp Business communications with AI assistant integration.

## Webhook Setup

To receive messages and status updates from WhatsApp Business API, you need to set up a webhook. Since this application may be running in a development environment, you'll need an intermediary service to receive webhooks from WhatsApp and forward them to your application.

### Deploying the Webhook Handler

1. Deploy the webhook handler (found in the `webhook-handler` directory) to a serverless function platform like:
   - Digital Ocean Functions
   - AWS Lambda
   - Vercel Functions
   - Netlify Functions

2. Set the following environment variables in your serverless function:
   - `APP_WEBHOOK_URL`: The URL where your application will be running (e.g., `https://your-app.com/api/webhook`)
   - `VERIFY_TOKEN`: A secret token that you'll provide to WhatsApp for verification
   - `WEBHOOK_SECRET`: A secret token that your application will use to verify incoming webhooks

3. Configure your WhatsApp Business API to send webhooks to your serverless function URL.

### WhatsApp Business API Configuration

1. Go to your WhatsApp Business API dashboard
2. Navigate to the Webhook settings
3. Enter your serverless function URL (e.g., `https://your-function.digitalocean.app`)
4. Enter the same `VERIFY_TOKEN` that you set in your serverless function
5. Select the webhook fields you want to receive (at minimum, select `messages` and `message_status`)

### Testing the Webhook

1. Send a test message to your WhatsApp Business number
2. Check the logs of your serverless function to ensure it received the webhook
3. Verify that the message appears in your application

## Environment Variables

The application requires the following environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Migrations

The application uses Supabase for database storage. Run the migrations in the `supabase/migrations` directory to set up the database schema.

## Configuration

In the application settings, you need to configure:

1. `TOKEN_META`: Your WhatsApp Business API token
2. `API`: The WhatsApp API URL
3. `TOKEN_CHATGPT`: Your OpenAI API key for the AI assistant
4. Other configuration values as needed