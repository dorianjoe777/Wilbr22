// WhatsApp Webhook Handler
// Deploy this as a serverless function on Digital Ocean, AWS Lambda, or similar

const axios = require('axios');

// This is the URL where your application will be running
// Update this when you deploy your application
const APP_WEBHOOK_URL = process.env.APP_WEBHOOK_URL || 'https://your-deployed-app-url.com/api/webhook';

// WhatsApp verification token (should match what you set in WhatsApp Business API)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verification_token';

/**
 * Main handler function for the serverless function
 */
exports.main = async (req, res) => {
  try {
    // Handle GET requests for webhook verification
    if (req.method === 'GET') {
      return handleVerification(req, res);
    }
    
    // Handle POST requests for actual webhook events
    if (req.method === 'POST') {
      return handleWebhookEvent(req, res);
    }
    
    // Method not allowed for other request types
    return res.status(405).send('Method Not Allowed');
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * Handle the webhook verification request from WhatsApp
 */
function handleVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }
    // Respond with '403 Forbidden' if verify tokens do not match
    return res.status(403).send('Forbidden');
  }
  
  return res.status(400).send('Bad Request');
}

/**
 * Handle the actual webhook event from WhatsApp
 */
async function handleWebhookEvent(req, res) {
  const body = req.body;
  
  // Check if this is a WhatsApp message event
  if (body.object === 'whatsapp_business_account') {
    // Log the received webhook for debugging
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    
    try {
      // Forward the webhook to your application
      await axios.post(APP_WEBHOOK_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          // You might want to add an authorization header here
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET || 'your_webhook_secret'
        }
      });
      
      console.log('Webhook forwarded successfully');
      return res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error('Error forwarding webhook:', error);
      // Still return 200 to WhatsApp so they don't retry
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
  
  return res.status(404).send('Not Found');
}