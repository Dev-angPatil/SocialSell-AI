const express = require('express');
const router = express.Router();

// POST /api/publish
router.post('/', async (req, res) => {
  const { caption, platform, mediaUrl } = req.body;

  if (!caption || !platform) {
    return res.status(400).json({ error: "Missing caption or platform" });
  }

  try {
    console.log(`Publishing to ${platform}:`, caption);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
      success: true,
      message: `Successfully published to ${platform}!`,
      postId: `mock_post_id_${Date.now()}`,
      publishedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to publish post", details: error.message });
  }
});

module.exports = router;
