const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase } = require('../../config/supabase');
const { calculateLeadScore } = require('./leads');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// ─── Lead Score Mappings (shared with leads.js via calculateLeadScore) ───────

const INTENT_BASE_SCORES = {
  buying_signal: 90,
  price_inquiry: 70,
  availability: 60,
  location: 40,
  faq: 20,
  unrecognized: 10
};

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
                platform: body.object === 'instagram' ? 'instagram' : 'facebook',
                type: 'comment',
                id: comment.from.id || comment.id,
                sender: comment.from.username || comment.from.name,
                senderId: comment.from.id,
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
                platform: body.object === 'instagram' ? 'instagram' : 'facebook',
                type: 'dm',
                id: messageEvent.sender.id,
                sender: `User_${messageEvent.sender.id.substring(0, 6)}`,
                senderId: messageEvent.sender.id,
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
  const contactId = event.senderId || event.id;
  const platform = event.platform;

  // Default Mock profile parameters
  let brandProfile = {
    name: "Mock Brand",
    niche: "Women's Fashion",
    products: [
      { name: "Summer Sundress", price: "₹1,499", description: "Light and breezy floral sundress" },
      { name: "Canvas Tote Bag", price: "₹799", description: "Eco-friendly aesthetic everyday carry tote" }
    ],
    tone: "Playful & Vibrant",
    cta_style: "DM us to order"
  };

  let userId = 'mock-user-id-123';

  try {
    // 1. Resolve owning userId & load actual database profile if Supabase is active
    if (supabase) {
      // First try to check if we have an existing lead to get the userId
      const { data: existingLead } = await supabase
        .from('leads')
        .select('user_id')
        .eq('contact_id', contactId)
        .eq('platform', platform)
        .limit(1)
        .maybeSingle();

      if (existingLead) {
        userId = existingLead.user_id;
      } else {
        // Find owner via integration records
        const { data: integration } = await supabase
          .from('integrations')
          .select('user_id')
          .eq('platform', platform)
          .limit(1)
          .maybeSingle();
        
        if (integration) {
          userId = integration.user_id;
        }
      }

      // If we resolved a real user, pull their profile & catalog
      if (userId && userId !== 'mock-user-id-123') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('profile_id', userId);

        if (profile) {
          brandProfile = {
            name: profile.company_name || "Our Shop",
            niche: profile.niche || "Retail",
            about: profile.about || "",
            tone: profile.branding_guidelines || "Friendly & professional",
            cta_style: profile.promote_type === 'products' ? 'Check our catalog' : 'Follow for updates',
            products: products || []
          };
        }
      }
    }

    let replyText = "";
    let intent = "unrecognized";

    if (!genAI) {
      // Mock classifier when API key is missing
      const text = event.text.toLowerCase();
      const firstProduct = brandProfile.products[0]?.name || "item";
      const secondProduct = brandProfile.products[1]?.name || "accessories";
      const firstPrice = brandProfile.products[0]?.price || "reasonable rates";
      const secondPrice = brandProfile.products[1]?.price || "great discounts";

      if (text.includes('price') || text.includes('how much') || text.includes('₹') || text.includes('cost')) {
        intent = 'price_inquiry';
        replyText = `Hey ${event.sender}! The ${firstProduct} is ${firstPrice} and the ${secondProduct} is ${secondPrice}. Would you like a checkout link? DM us to order!`;
      } else if (text.includes('available') || text.includes('stock') || text.includes('buy')) {
        intent = 'buying_signal';
        replyText = `Hi ${event.sender}! Yes, it is fully in stock! You can purchase directly here: https://socialsell.ai/checkout/mock. Let us know if you need anything else!`;
      } else if (text.includes('where') || text.includes('location') || text.includes('store') || text.includes('city')) {
        intent = 'location';
        replyText = `Hi ${event.sender}! We're online-only right now but ship across our service regions. Visit our profile shop to browse!`;
      } else if (text.includes('size') || text.includes('material') || text.includes('color') || text.includes('delivery')) {
        intent = 'faq';
        replyText = `Thanks for reaching out, ${event.sender}! Let us know if you have any questions about our products or sizes. We are here to help!`;
      } else {
        intent = 'unrecognized';
        replyText = `Thanks for reaching out, ${event.sender}! Check out our collection and let us know if anything catches your eye!`;
      }
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        You are the AI Sales Bot for the business: ${brandProfile.name} (Niche: ${brandProfile.niche}).
        You are responding to an incoming customer ${event.type} on ${event.platform}.
        
        Business Context:
        - About: ${brandProfile.about || 'E-commerce store'}
        - Products/Services Catalog: ${JSON.stringify(brandProfile.products)}
        - Brand Tone Guidelines: ${brandProfile.tone}
        - Preferred Call To Action (CTA): ${brandProfile.cta_style}
        
        Customer Info:
        - Sender Name: ${event.sender}
        - Social Platform: ${event.platform}
        - Communication Type: ${event.type} (either comment or dm)
        - Incoming Message: "${event.text}"
        
        Analyze the incoming message, classify the user's intent, and generate a natural, sales-focused response. Keep it friendly, responsive, and concise (especially if it is a public comment).
        
        Classify intent into one of:
        - "price_inquiry" (asking how much it costs)
        - "availability" (asking if it is in stock or ships to their location)
        - "buying_signal" (expressing strong intent to purchase)
        - "location" (asking about physical store or delivery area)
        - "faq" (asking details about sizing, material, delivery, etc.)
        - "unrecognized" (other chat, casual greetings)
        
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

    // ─── Create or Update Lead ────────────────────────────────────────────
    await upsertLead(event, intent, replyText, userId);
    
  } catch (error) {
    console.error('Error generating reply via Gemini:', error);
  }
}

/**
 * Create a new lead or update an existing one for the same contact_id + platform.
 * Appends incoming message and bot response to the conversation array.
 */
async function upsertLead(event, intent, replyText, resolvedUserId) {
  const contactId = event.senderId || event.id;
  const platform = event.platform;
  const now = new Date().toISOString();

  const incomingEntry = {
    role: 'customer',
    message: event.text,
    timestamp: now
  };

  const botEntry = {
    role: 'bot',
    message: replyText,
    timestamp: now
  };

  try {
    if (!supabase) {
      // ── Mock fallback: log and skip DB operations ──
      console.log(`📋 [Mock] Lead upsert for ${event.sender} (${contactId}) on ${platform} — intent: ${intent}`);
      return;
    }

    // 1. Check if a lead already exists for this contact_id + platform
    const { data: existingLeads, error: lookupError } = await supabase
      .from('leads')
      .select('*')
      .eq('contact_id', contactId)
      .eq('platform', platform)
      .limit(1);

    if (lookupError) {
      console.error('Lead lookup error:', lookupError);
      return;
    }

    if (existingLeads && existingLeads.length > 0) {
      // ── Update existing lead ──────────────────────────────────────────
      const existing = existingLeads[0];
      const updatedConversation = [...(existing.conversation || []), incomingEntry, botEntry];

      // Re-score with new context
      const newScore = calculateLeadScore(intent, updatedConversation, event.text);

      // Upgrade intent if the new one has a higher base score
      const currentIntentScore = INTENT_BASE_SCORES[existing.intent] || 0;
      const newIntentScore = INTENT_BASE_SCORES[intent] || 0;
      const resolvedIntent = newIntentScore > currentIntentScore ? intent : existing.intent;

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          intent: resolvedIntent,
          score: newScore,
          conversation: updatedConversation,
          contact_name: event.sender || existing.contact_name,
          contact_handle: event.sender ? `@${event.sender}` : existing.contact_handle
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Lead update error:', updateError);
      } else {
        console.log(`📋 Lead updated for ${event.sender} (score: ${newScore}, intent: ${resolvedIntent})`);
      }
    } else {
      // ── Create new lead ───────────────────────────────────────────────
      const conversation = [incomingEntry, botEntry];
      const score = calculateLeadScore(intent, conversation, event.text);

      const userId = resolvedUserId && resolvedUserId !== 'mock-user-id-123' ? resolvedUserId : null;

      if (!userId) {
        console.warn(`⚠️ Could not resolve user_id for platform ${platform}. Skipping lead creation.`);
        return;
      }

      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          platform,
          contact_name: event.sender,
          contact_handle: `@${event.sender}`,
          contact_id: contactId,
          intent,
          score,
          status: 'new',
          conversation
        });

      if (insertError) {
        console.error('Lead creation error:', insertError);
      } else {
        console.log(`📋 New lead created for ${event.sender} (score: ${score}, intent: ${intent})`);
      }
    }
  } catch (err) {
    console.error('Lead upsert error:', err);
  }
}

module.exports = router;
