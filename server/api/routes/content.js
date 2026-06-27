const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// In-memory store for drafts
const drafts = [];

// Initialize Gemini API if key is available
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// POST /api/content/generate
router.post('/generate', async (req, res) => {
  const { brief, platform, businessProfile } = req.body;

  if (!brief) {
    return res.status(400).json({ error: "Missing brief" });
  }

  try {
    let caption = "";
    let hashtags = "";
    let cta = "";

    if (!genAI) {
      console.warn("⚠️ GEMINI_API_KEY not found. Using fallback mock generation.");
      // Fallback mock generation if no API key
      caption = `✨ Exciting news from ${businessProfile?.name || 'our shop'}! ✨\n\nLooking for the perfect addition to your style? ${brief}\n\nOur products are crafted with premium materials to fit your lifestyle. Grab yours now before stocks run out!`;
      hashtags = "#style #fashion #shoplocal #sale #aesthetic";
      cta = businessProfile?.cta_style || "DM us to order";
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        You are SocialSell AI, a marketing expert.
        Generate a high-converting, platform-native social media post for the platform: ${platform || 'Instagram'}.
        
        Business Profile:
        - Name: ${businessProfile?.name || 'Our Brand'}
        - Niche: ${businessProfile?.niche || 'General'}
        - Products/Pricing: ${JSON.stringify(businessProfile?.products || [])}
        - Tone of Voice: ${businessProfile?.tone || 'Friendly & Professional'}
        - Target Audience: ${businessProfile?.target_audience || 'General Public'}
        - Preferred Call To Action (CTA): ${businessProfile?.cta_style || 'Send a message'}
        
        Post Brief / Topic: "${brief}"
        
        Guidelines for ${platform || 'Instagram'}:
        - Keep the tone matching the Brand's Tone of Voice.
        - Format the output with spacing and emojis to make it highly engaging and readable.
        - Ensure it has a strong hook in the first 1-2 lines.
        - Integrate the Brand's preferred CTA naturally at the end.
        
        Provide your response in JSON format with exactly three fields:
        {
          "caption": "The main caption text",
          "hashtags": "Space-separated hashtags tailored to the post and brand",
          "cta": "The specific CTA used in the post"
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);
      caption = parsed.caption;
      hashtags = parsed.hashtags;
      cta = parsed.cta;
    }

    const newDraft = {
      id: Date.now().toString(),
      brief,
      platform: platform || 'Instagram',
      caption,
      hashtags,
      cta,
      createdAt: new Date(),
      status: 'draft'
    };

    drafts.unshift(newDraft);

    res.json({ success: true, draft: newDraft });
  } catch (error) {
    console.error("Gemini Content Generation Error:", error);
    res.status(500).json({ error: "Failed to generate content", details: error.message });
  }
});

// GET /api/content/drafts
router.get('/drafts', (req, res) => {
  res.json(drafts);
});

module.exports = router;
