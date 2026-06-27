const express = require('express');
const router = express.Router();
const { publishToInstagram } = require('../../publishers/instagram');
const { publishToLinkedIn } = require('../../publishers/linkedin');
const { requireAuth } = require('../../middleware/auth');

const supabase = require('../../config/supabase');

// Apply requireAuth middleware to protect the publish endpoint
router.use(requireAuth);

// POST /api/publish - Publish post (Uses SSE/Streaming response for live progress logging)
router.post('/', async (req, res) => {
  const { caption, platform, mediaUrl } = req.body;

  if (!caption) {
    return res.status(400).json({ error: "Missing caption" });
  }

  // 1. Establish text/event-stream headers for real-time progress updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish connection immediately

  const sendProgress = (step, detail, status = 'in_progress') => {
    res.write(`data: ${JSON.stringify({ step, detail, status })}\n\n`);
  };

  try {
    // 2. Fetch User Profile to check for social tokens
    sendProgress('Auth Verification', 'Checking session authorization...', 'in_progress');
    
    // Default fallback to environment variables
    let metaToken = process.env.META_ACCESS_TOKEN || null;
    let metaAccountId = process.env.META_BUSINESS_ACCOUNT_ID || null;
    let linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
    let linkedinPersonId = process.env.LINKEDIN_PERSON_ID || null;

    // Load active OAuth integrations from database
    if (!supabase) {
      const integrations = (global.mockIntegrations || []).filter(i => i.user_id === req.user.id);
      const ig = integrations.find(i => i.platform === 'instagram');
      const li = integrations.find(i => i.platform === 'linkedin');
      
      if (ig) {
        metaToken = ig.access_token;
        metaAccountId = ig.platform_account_id;
      }
      if (li) {
        linkedinToken = li.access_token;
        linkedinPersonId = li.platform_account_id;
      }
    } else {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', req.user.id);
      
      if (!error && integrations) {
        const ig = integrations.find(i => i.platform === 'instagram');
        const li = integrations.find(i => i.platform === 'linkedin');
        
        if (ig) {
          metaToken = ig.access_token;
          metaAccountId = ig.platform_account_id;
        }
        if (li) {
          linkedinToken = li.access_token;
          linkedinPersonId = li.platform_account_id;
        }
      }
    }

    if (platform === 'Instagram') {
      sendProgress('Instagram Post Queue', 'Initializing Instagram publishing sequence...', 'in_progress');
      
      const result = await publishToInstagram({
        caption,
        mediaUrl,
        accessToken: metaToken,
        businessAccountId: metaAccountId,
        onProgress: (detail) => sendProgress('Instagram Publishing', detail, 'in_progress')
      });

      sendProgress('Complete', `🎉 Success! Published to Instagram. Post ID: ${result.postId}`, 'success');
    } else if (platform === 'LinkedIn') {
      sendProgress('LinkedIn Post Queue', 'Initializing LinkedIn social share...', 'in_progress');

      const result = await publishToLinkedIn({
        caption,
        accessToken: linkedinToken,
        personId: linkedinPersonId,
        onProgress: (detail) => sendProgress('LinkedIn Publishing', detail, 'in_progress')
      });

      sendProgress('Complete', `🎉 Success! Published to LinkedIn. Post URN ID: ${result.postId}`, 'success');
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

  } catch (error) {
    console.error('Publish API router error:', error);
    sendProgress('Error', `❌ Publishing Failed: ${error.message}`, 'failed');
  } finally {
    res.end(); // Close the streaming response
  }
});

module.exports = router;
