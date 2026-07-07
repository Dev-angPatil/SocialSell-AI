const express = require('express');
const router = express.Router();
const { publishPost } = require('../../services/publisherService');
const { requireAuth } = require('../../middleware/auth');
const { supabase } = require('../../config/supabase');

// Shared memory store for offline testing
global.mockPosts = global.mockPosts || [];

// Apply requireAuth middleware to protect the publish endpoint
router.use(requireAuth);

// POST /api/publish - Publish post (Uses SSE/Streaming response for live progress logging)
router.post('/', async (req, res) => {
  const { caption, platform, mediaUrl, postId } = req.body;

  // Establish text/event-stream headers for real-time progress updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish connection immediately

  const sendProgress = (step, detail, status = 'in_progress') => {
    res.write(`data: ${JSON.stringify({ step, detail, status })}\n\n`);
  };

  try {
    let targetPostId = postId;

    // If no postId is passed (direct quick publish), create a temporary draft post
    if (!targetPostId) {
      const tempPost = {
        user_id: req.user.id,
        platform: platform || 'Instagram',
        caption: caption || '',
        media_url: mediaUrl || '',
        status: 'draft',
        created_at: new Date().toISOString()
      };

      if (!supabase) {
        tempPost.id = `temp-post-${Date.now()}`;
        global.mockPosts.push(tempPost);
        targetPostId = tempPost.id;
      } else {
        const { data, error } = await supabase
          .from('posts')
          .insert([tempPost])
          .select()
          .single();
        
        if (error) throw error;
        targetPostId = data.id;
      }
    }

    // Call the centralized publisher service
    await publishPost({
      postId: targetPostId,
      userId: req.user.id,
      onProgress: sendProgress
    });

  } catch (error) {
    console.error('Publish API router error:', error);
    sendProgress('Error', `❌ Publishing Failed: ${error.message}`, 'failed');
  } finally {
    res.end(); // Close the streaming response
  }
});

module.exports = router;
