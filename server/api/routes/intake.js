const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireAuth } = require('../../middleware/auth');
const supabase = require('../../config/supabase');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Mock store for offline testing
global.mockIntakeItems = global.mockIntakeItems || [];
global.mockPosts = global.mockPosts || [];

// Protect all intake routes
router.use(requireAuth);

// GET /api/intake - Fetch all intake items (texts & media merged)
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      const userTextItems = global.mockIntakeItems.filter(i => i.user_id === req.user.id);
      const userAssets = (global.mockAssets || []).filter(a => a.user_id === req.user.id).map(a => ({
        id: a.id,
        user_id: a.user_id,
        type: 'media',
        sub_type: 'media',
        content: `Media Uploaded: ${a.filename}`,
        media_url: a.file_url,
        created_at: a.created_at
      }));
      
      const merged = [...userTextItems, ...userAssets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json(merged);
    }

    // Load text items
    const { data: textItems, error: textErr } = await supabase
      .from('intake_items')
      .select('*')
      .eq('user_id', req.user.id);
    
    if (textErr) throw textErr;

    // Load media assets
    const { data: mediaAssets, error: mediaErr } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', req.user.id);

    if (mediaErr) throw mediaErr;

    const mappedMedia = mediaAssets.map(a => ({
      id: a.id,
      user_id: a.user_id,
      type: 'media',
      sub_type: 'media',
      content: `Media File: ${a.filename}`,
      media_url: a.file_url,
      created_at: a.created_at
    }));

    const merged = [...textItems, ...mappedMedia].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(merged);

  } catch (err) {
    console.error('Fetch intake items error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intake - Add a new text announcement (Offer, Deal, Achievement) & auto-generate drafts
router.post('/', async (req, res) => {
  const { subType, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Announcement content is required.' });
  }

  try {
    const intakeId = `intake-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const intakeItem = {
      id: intakeId,
      user_id: req.user.id,
      type: 'text',
      sub_type: subType || 'announcement',
      content,
      media_url: null,
      created_at: new Date().toISOString()
    };

    // Save intake item
    let savedIntake;
    if (!supabase) {
      global.mockIntakeItems.unshift(intakeItem);
      savedIntake = intakeItem;
    } else {
      const { data, error } = await supabase
        .from('intake_items')
        .insert([{
          user_id: req.user.id,
          type: 'text',
          sub_type: subType || 'announcement',
          content
        }])
        .select()
        .single();
      
      if (error) throw error;
      savedIntake = data;
    }

    // Load business profile context
    let profile = null;
    if (!supabase) {
      profile = {
        company_name: 'Our Shop',
        niche: 'Lifestyle products',
        about: 'Premium eco-friendly essentials',
        branding_guidelines: 'Clean and modern tone'
      };
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      if (!error) profile = data;
    }

    // Trigger Gemini Multi-Platform generation
    const drafts = await generateDraftsFromText({
      subType: savedIntake.sub_type,
      content: savedIntake.content,
      profile,
      userId: req.user.id,
      intakeId: savedIntake.id
    });

    res.status(201).json({
      success: true,
      intake: savedIntake,
      generatedDraftCount: drafts.length
    });

  } catch (err) {
    console.error('Create intake announcement error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Call Gemini to produce multi-platform drafts from a single text update
async function generateDraftsFromText({ subType, content, profile, userId, intakeId }) {
  const brandName = profile?.company_name || 'Our Shop';
  
  try {
    if (!genAI) {
      console.warn("⚠️ Gemini API not configured. Creating offline mock drafts.");
      return createMockDrafts({ subType, content, brandName, userId, intakeId });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are SocialSell AI, a marketing agent.
      A business just uploaded a new update/input in their Intake Hub:
      - Category: ${subType} (e.g. achievement, offer, deal)
      - Detail: "${content}"
      
      Brand context:
      - Brand Name: ${brandName}
      - Brand niche: ${profile?.niche || 'retail'}
      - Tone: ${profile?.branding_guidelines || 'professional'}
      
      Create exactly two post suggestions:
      1. A post for "LinkedIn" (suitability: professional achievement sharing, value add, longer paragraphs).
      2. A post for "Twitter" (suitability: short, punchy update, strictly under 280 characters, highly active, hashtags).
      
      Provide your response in JSON format matching this exact schema:
      {
        "posts": [
          {
            "platform": "LinkedIn",
            "classification_reason": "Explain why this info is suited for LinkedIn audience.",
            "caption": "LinkedIn post copy...",
            "hashtags": "#business #success",
            "cta": "Link in bio"
          },
          {
            "platform": "Twitter",
            "classification_reason": "Explain why this short update is suited for Twitter.",
            "caption": "Twitter tweet copy...",
            "hashtags": "#update #deal",
            "cta": "Visit site"
          }
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(result.response.text());
    const insertedDrafts = [];

    for (const post of data.posts) {
      const draft = {
        user_id: userId,
        asset_id: null, // text draft, no asset file
        platform: post.platform,
        caption: post.caption,
        hashtags: post.hashtags,
        cta: post.cta || '',
        media_url: null,
        status: 'draft',
        classification_reason: post.classification_reason,
        created_at: new Date().toISOString()
      };

      if (!supabase) {
        draft.id = `post-${Date.now()}-${Math.round(Math.random() * 1000)}`;
        global.mockPosts.unshift(draft);
        insertedDrafts.push(draft);
      } else {
        const { data: dbData, error } = await supabase
          .from('posts')
          .insert([draft])
          .select()
          .single();
        if (!error) insertedDrafts.push(dbData);
      }
    }

    return insertedDrafts;

  } catch (error) {
    console.error('Gemini text-to-draft error:', error);
    return createMockDrafts({ subType, content, brandName, userId, intakeId });
  }
}

// Heuristics for text announcements in offline mode
function createMockDrafts({ subType, content, brandName, userId, intakeId }) {
  const drafts = [
    {
      id: `post-${Date.now()}-li`,
      user_id: userId,
      platform: 'LinkedIn',
      classification_reason: `This ${subType} update works well on LinkedIn to showcase business milestones and build professional trust.`,
      caption: `📈 Proud moment at ${brandName}!\n\nWe're thrilled to share: ${content}\n\nThank you to our dedicated team and partners who made this possible. Excited for what's next!`,
      hashtags: `#business #growth #milestone #${brandName.toLowerCase().replace(/\s+/g, '')}`,
      cta: 'Follow for updates',
      media_url: null,
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      id: `post-${Date.now()}-tw`,
      user_id: userId,
      platform: 'Twitter',
      classification_reason: `This brief ${subType} is perfect for Twitter's fast-paced feed to update followers instantly.`,
      caption: `Big news from the team! 🚀\n\n${content.substring(0, 160)}... #${subType}`,
      hashtags: `#milestone #${brandName.toLowerCase().replace(/\s+/g, '')}`,
      cta: 'Check it out',
      media_url: null,
      status: 'draft',
      created_at: new Date().toISOString()
    }
  ];

  global.mockPosts.unshift(...drafts);
  return drafts;
}

module.exports = router;
