import type { Context } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/database.types';
import { processWebhookEvent } from '../../src/lib/webhook';

// Create Supabase client with process.env instead of import.meta.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export default async (req: Request, context: Context) => {
  try {
    // Handle GET requests for webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      // Fetch VERIFY_TOKEN from Supabase configurations
      const { data: config, error } = await supabase
        .from('configurations')
        .select('value')
        .eq('key', 'TOKEN_META')
        .single();

      if (error) {
        console.error('Error fetching VERIFY_TOKEN:', error);
        return new Response('Configuration Error', { status: 500 });
      }

      const verifyToken = config?.value;
      
      if (!verifyToken) {
        console.error('TOKEN_META not configured in Supabase');
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
        const body = await req.json();
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const providedSecret = req.headers.get('x-webhook-secret');

        // Verify webhook secret if configured
        if (webhookSecret && providedSecret !== webhookSecret) {
          return new Response('Forbidden', { status: 403 });
        }

        // Process the webhook event using the Supabase client
        const result = await processWebhookEvent(body, supabase);
        
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