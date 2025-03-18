import express from 'express';
import cors from 'cors';
import { processWebhookEvent } from './lib/webhook';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Webhook verification endpoint
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Verify token from environment variable
  const verifyToken = process.env.VERIFY_TOKEN;
  
  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
    return;
  }
  
  res.sendStatus(400);
});

// Webhook event handler
app.post('/api/webhook', async (req, res) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const providedSecret = req.headers['x-webhook-secret'];
  
  // Verify webhook secret
  if (webhookSecret && providedSecret !== webhookSecret) {
    res.sendStatus(403);
    return;
  }
  
  try {
    const result = await processWebhookEvent(req.body);
    if (result.success) {
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Webhook server listening on port ${port}`);
});