const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper to convert local file to the representation needed by Gemini
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

/**
 * Uses Gemini Multimodal API to analyze media and generate optimal post drafts
 */
async function analyzeMediaAsset({ filePath, mimeType, companyProfile }) {
  try {
    if (!genAI) {
      console.warn("⚠️ GEMINI_API_KEY not configured. Falling back to local heuristic analyzer.");
      return runMockAnalysis(mimeType, companyProfile);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const mediaPart = fileToGenerativePart(filePath, mimeType);

    const prompt = `
      You are SocialSell AI, a marketing strategist.
      Analyze the attached media file (image or video) and determine the optimal social media platform for it.
      
      Choose the single best platform from:
      - "Instagram" (good for standard 1:1 or 4:5 photos/carousels)
      - "Instagram Reels" (good for vertical 9:16 videos, trends)
      - "LinkedIn" (good for professional stories, business tips, infographics)
      - "Facebook" (good for community updates, events, family/customer focus)
      
      Rule:
      - If the asset is a vertical video (9:16), it should be classified as "Instagram Reels".
      - Explain why this platform was selected and specifically mention if it is inappropriate for other channels (e.g., "A vertical trend video is highly engaging for Instagram Reels but inappropriate for LinkedIn professional text feeds").
      
      Company Context:
      - Name: ${companyProfile?.company_name || 'Our Brand'}
      - Niche: ${companyProfile?.niche || 'General'}
      - About: ${companyProfile?.about || 'Commercial shop'}
      - Tone: ${companyProfile?.branding_guidelines || 'Friendly & Professional'}
      
      Generate highly-engaging platform-native copy: caption, hashtags, and CTA.
      
      Provide your response in JSON format with this exact structure:
      {
        "selected_platform": "Instagram Reels | Instagram | LinkedIn | Facebook",
        "classification_reason": "A 1-2 sentence description of why it fits this platform and why it is inappropriate for others.",
        "caption": "Post caption copy matching the chosen platform's native tone.",
        "hashtags": "Space-separated hashtags.",
        "cta": "Actionable CTA."
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [mediaPart, { text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);

  } catch (error) {
    console.error('❌ Multimodal analysis error:', error);
    // Return a safe heuristic fallback if API call fails
    return runMockAnalysis(mimeType, companyProfile);
  }
}

// Local mock heuristics for offline mode
function runMockAnalysis(mimeType, profile) {
  const isVideo = mimeType.startsWith('video/');
  const brandName = profile?.company_name || 'My Brand';
  
  if (isVideo) {
    return {
      selected_platform: "Instagram Reels",
      classification_reason: "This vertical video format is ideal for Instagram Reels to drive organic reach. It is inappropriate for LinkedIn due to its casual video trends style.",
      caption: `🎬 Behind the scenes at ${brandName}! See how we bring quality to life.\n\nWhat do you think of this process? Drop your thoughts below!`,
      hashtags: `#reels #trending #behindthescenes #${brandName.toLowerCase().replace(/\s+/g, '')} #viral`,
      cta: "Follow us for more updates"
    };
  } else {
    // Default to LinkedIn or Instagram feed
    const rand = Math.random() > 0.5;
    if (rand) {
      return {
        selected_platform: "LinkedIn",
        classification_reason: "This static graphic/photo works perfectly on LinkedIn to share business insights. It is less suitable for Instagram Reels since it lacks motion.",
        caption: `💡 How we approach solving challenges at ${brandName}.\n\nIn our latest run, we've focused on sustainability and efficiency. What strategies are you adopting this quarter? Let's discuss in the comments.`,
        hashtags: `#business #management #leadership #${brandName.toLowerCase().replace(/\s+/g, '')} #sustainability`,
        cta: "Comment your thoughts below"
      };
    } else {
      return {
        selected_platform: "Instagram",
        classification_reason: "The visual aesthetic of this photo makes it perfect for a standard Instagram feed post. It is not styled as a text-only LinkedIn share.",
        caption: `✨ A close look at our latest creation at ${brandName}. Made with care and attention to detail. Just for you.`,
        hashtags: `#aesthetic #picoftheday #lifestyle #${brandName.toLowerCase().replace(/\s+/g, '')} #explore`,
        cta: "Tap the link in bio to shop"
      };
    }
  }
}

module.exports = { analyzeMediaAsset };
