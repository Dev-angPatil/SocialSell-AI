const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { requireAuth } = require('../../middleware/auth');

// Protect all schedule routes
router.use(requireAuth);

// Mock schedule database
const mockSchedule = [
  {
    id: "s1",
    platform: "Instagram",
    caption: "Upgrade your summer look! 👗✨ Our new floral sundresses are designed to keep you cool and stylish. Handcrafted, light, and beautiful.",
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    status: "scheduled"
  },
  {
    id: "s2",
    platform: "Facebook",
    caption: "Perfect for weekends and beach days. 🏖️ Our canvas tote bags fit all your essentials. Order yours today!",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
    status: "scheduled"
  }
];

// GET /api/schedule
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.json(mockSchedule);
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', req.user.id)
      .not('scheduled_at', 'is', null)
      .order('scheduled_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Map DB snake_case scheduled_at to camelCase scheduledAt for frontend consistency
    const formatted = data.map(p => ({
      id: p.id,
      platform: p.platform,
      caption: p.caption,
      scheduledAt: p.scheduled_at,
      status: p.status
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch schedule error:', err);
    res.status(500).json({ error: 'Internal server error fetching schedule' });
  }
});

// POST /api/schedule
router.post('/', async (req, res) => {
  const { caption, platform, scheduledAt } = req.body;
  if (!caption || !platform || !scheduledAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    if (!supabase) {
      const newPost = {
        id: Date.now().toString(),
        caption,
        platform,
        scheduledAt,
        status: "scheduled"
      };

      mockSchedule.push(newPost);
      return res.json({ message: "Post scheduled successfully", post: newPost });
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: req.user.id,
        caption,
        platform,
        scheduled_at: scheduledAt,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Post scheduled successfully",
      post: {
        id: data.id,
        caption: data.caption,
        platform: data.platform,
        scheduledAt: data.scheduled_at,
        status: data.status
      }
    });
  } catch (err) {
    console.error('Create scheduled post error:', err);
    res.status(500).json({ error: 'Internal server error scheduling post' });
  }
});

module.exports = router;
