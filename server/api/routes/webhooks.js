const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// GET /webhooks/meta (Webhook verification for Meta)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'socialsell_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Meta Webhook Verified!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification token mismatch');
    }
  }
  
  res.status(400).send('Bad Request');
});

// POST /webhooks/meta (Receive webhook events)
router.post('/', async (req, res) => {
  const { body } = req;

  // Let Meta know we received the event immediately to avoid retries
  res.status(200).send('EVENT_RECEIVED');

  // Asynchronously process the event (so we don't block the webhook response)
  try {
    if (body.object === 'page' || body.object === 'instagram') {
      for (const entry of body.entry) {
        // Handle Instagram comments/DMs or Facebook feed comments
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              const comment = change.value;
              console.log(`💬 New comment from ${comment.from.username || comment.from.name}: "${comment.text}"`);
              
              await processWebhookEvent({
                platform: body.object === 'instagram' ? 'Instagram' : 'Facebook',
                type: 'comment',
                id: comment.id,
                sender: comment.from.username || comment.from.name,
                text: comment.text,
                postId: comment.post_id || entry.id
              });
            }
          }
        }
        
        if (entry.messaging) {
          for (const messageEvent of entry.messaging) {
            if (messageEvent.message && !messageEvent.message.is_echo) {
              const message = messageEvent.message;
              console.log(`✉️ New DM from user ${messageEvent.sender.id}: "${message.text}"`);
              
              await processWebhookEvent({
                platform: body.object === 'instagram' ? 'Instagram' : 'Facebook',
                type: 'dm',
                id: messageEvent.sender.id,
                sender: `User_${messageEvent.sender.id.substring(0, 6)}`,
                text: message.text
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing Meta Webhook Event:', error);
  }
});

// AI processing engine helper
async function processWebhookEvent(event) {
  // Mock business profile for context
  const mockProfile = {
    name: "Mock Brand",
    niche: "Women's Fashion",
    products: [
      { name: "Summer Sundress", price: "₹1,499", description: "Light and breezy floral sundress" },
      { name: "Canvas Tote Bag", price: "₹799", description: "Eco-friendly aesthetic everyday carry tote" }
    ],
    tone: "Playful & Vibrant",
    cta_style: "DM us to order"
  };

  try {
    let replyText = "";
    let intent = "unknown";

    if (!genAI) {
      // Mock classifier when API key is missing
      const text = event.text.toLowerCase();
      if (text.includes('price') || text.includes('how much') || text.includes('₹') || text.includes('cost')) {
        intent = 'price_inquiry';
        replyText = `Hey ${event.sender}! The Summer Sundress is ₹1,499 and the Canvas Tote Bag is ₹799. Would you like a checkout link? DM us to order!`;
      } else if (text.includes('available') || text.includes('stock') || text.includes('buy')) {
        intent = 'buying_signal';
        replyText = `Hi ${event.sender}! Yes, it is fully in stock! You can purchase directly here: https://socialsell.ai/checkout/mock. Let us know if you need anything else!`;
      } else {
        intent = 'faq';
        replyText = `Thanks for reaching out, ${event.sender}! Let us know if you have any questions about our products or sizes. We are here to help!`;
      }
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        You are the AI Sales Bot for the business: ${mockProfile.name} (${mockProfile.niche}).
        You are responding to an incoming customer ${event.type} on ${event.platform}.
        
        Business Context:
        - Products/Services: ${JSON.stringify(mockProfile.products)}
        - Brand Tone: ${mockProfile.tone}
        - Preferred Call To Action (CTA): ${mockProfile.cta_style}
        
        Customer Info:
        - Sender: ${event.sender}
        - Platform: ${event.platform}
        - Communication Type: ${event.type} (either comment or dm)
        - Incoming Message: "${event.text}"
        
        Analyze the incoming message, classify the user's intent, and generate a natural, sales-focused response. Keep it friendly and concise (especially if it is a public comment).
        
        Classify intent into one of:
        - "price_inquiry" (asking how much it costs)
        - "availability" (asking if it is in stock or ships to their location)
        - "buying_signal" (expressing strong intent to purchase)
        - "faq" (asking details about sizing, material, delivery, etc.)
        - "unknown" (other chat, casual greetings)
        
        Provide the response in JSON format:
        {
          "intent": "intent_category",
          "replyText": "Your generated reply message"
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(result.response.text());
      intent = parsed.intent;
      replyText = parsed.replyText;
    }

    console.log(`🤖 Bot response to ${event.sender} (Intent: ${intent}): "${replyText}"`);
    
    // In a live app, we would make an API call to Meta to send this message:
    // If comment: POST /v17.0/{comment-id}/replies
    // If DM: POST /v17.0/me/messages
    
  } catch (error) {
    console.error('Error generating reply via Gemini:', error);
  }
}

module.exports = router;
