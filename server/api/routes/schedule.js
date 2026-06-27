const express = require('express');
const router = express.Router();

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
router.get('/', (req, res) => {
  res.json(mockSchedule);
});

// POST /api/schedule
router.post('/', (req, res) => {
  const { caption, platform, scheduledAt } = req.body;
  if (!caption || !platform || !scheduledAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newPost = {
    id: Date.now().toString(),
    caption,
    platform,
    scheduledAt,
    status: "scheduled"
  };

  mockSchedule.push(newPost);
  res.json({ message: "Post scheduled successfully", post: newPost });
});

module.exports = router;
