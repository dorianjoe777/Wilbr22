import type { Context } from "@netlify/functions";
import { processWebhookEvent } from '../../src/lib/webhook';
import type { WhatsAppWebhook } from '../../src/lib/webhook';

export default async (req: Request, context: Context) => {
  try {
    // Handle GET requests for webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // Verify token from environment variable
      const verifyToken = Netlify.env.get("VERIFY_TOKEN");
      
      if (!verifyToken) {
        console.error('VERIFY_TOKEN not configured');
        return new Response('Configuration Error', { status: 500 });
      }

      if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
          console.log('WEBHOOK_VERIFIED');
          return new Response(challenge || '', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        return new Response('Forbidden', { status: 403 });
      }
      return new Response('Bad Request', { status: 400 });
    }

    // Handle POST requests for webhook events
    if (req.method === 'POST') {
      try {
        const body = await req.json() as WhatsAppWebhook;
        const webhookSecret = Netlify.env.get("WEBHOOK_SECRET");
        const providedSecret = req.headers.get('x-webhook-secret');

        // Verify webhook secret if configured
        if (webhookSecret && providedSecret !== webhookSecret) {
          return new Response('Forbidden', { status: 403 });
        }

        // Process the webhook event
        const result = await processWebhookEvent(body);
        
        if (result.success) {
          return new Response('EVENT_RECEIVED', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        return new Response(JSON.stringify({ error: result.error }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// Configure the function route
export const config = {
  path: "/api/webhook"
};