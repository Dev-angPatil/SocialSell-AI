const express = require('express');
const router = express.Router();

// Mock analytics snapshot
const mockAnalytics = {
  summary: {
    combinedReach: 48500,
    reachChange: 14.5, // %
    totalInquiries: 382,
    inquiriesChange: 22.4, // %
    botConversations: 310,
    botConvChange: 18.2, // %
    conversions: 84,
    conversionsChange: 35.8, // %
    estimatedRevenue: "₹1,25,900"
  },
  funnelData: [
    { name: "Impressions/Reach", value: 48500 },
    { name: "DM/Comment Inquiries", value: 382 },
    { name: "Sales Bot Interactions", value: 310 },
    { name: "Conversions (Sales)", value: 84 }
  ],
  weeklyPerformance: [
    { day: "Mon", reach: 4000, inquiries: 32, sales: 5 },
    { day: "Tue", reach: 4500, inquiries: 35, sales: 8 },
    { day: "Wed", reach: 5200, inquiries: 42, sales: 10 },
    { day: "Thu", reach: 4800, inquiries: 38, sales: 7 },
    { day: "Fri", reach: 6100, inquiries: 55, sales: 15 },
    { day: "Sat", reach: 7500, inquiries: 70, sales: 22 },
    { day: "Sun", reach: 8400, inquiries: 80, sales: 27 }
  ],
  platformDistribution: [
    { name: "Instagram", value: 65 },
    { name: "Facebook", value: 20 },
    { name: "LinkedIn", value: 15 }
  ],
  topPerformingPosts: [
    {
      id: "p1",
      platform: "Instagram",
      type: "Reel",
      caption: "GRWM: Styling the Summer Sundress for a beach day! 🏖️✨",
      reach: 22400,
      inquiries: 198,
      conversions: 45,
      revenue: "₹67,455"
    },
    {
      id: "p2",
      platform: "Instagram",
      type: "Reel",
      caption: "Everything that fits in our Canvas Tote Bag! 🎒",
      reach: 15100,
      inquiries: 120,
      conversions: 28,
      revenue: "₹22,372"
    }
  ]
};

// GET /api/analytics/dashboard
router.get('/dashboard', (req, res) => {
  res.json(mockAnalytics);
});

module.exports = router;
