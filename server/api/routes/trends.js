const express = require('express');
const router = express.Router();

// Mock trends database
const mockTrends = [
  {
    id: "t1",
    title: "GRWM (Get Ready With Me)",
    type: "Reel Format",
    trendingAudio: "Chill Lofi Beats - Aesthetic Vibes",
    description: "Creators show their morning preparation routine, naturally incorporating product usage.",
    relevanceReason: "High watch-time retention. Perfect for fashion, beauty, or daily lifestyle products.",
    suggestedBrief: "Show outfit prep using your new Summer Sundress, ending with the sundress reveal."
  },
  {
    id: "t2",
    title: "Before & After Reveal",
    type: "Reel Format / TikTok",
    trendingAudio: "Dramatic Transition Drop",
    description: "Rapid visual change from messy/empty state to polished/finished state.",
    relevanceReason: "Creates instant visual contrast and high rewatchability.",
    suggestedBrief: "Show an empty canvas tote bag, then pack it with everyday essentials in a fast-cut style."
  },
  {
    id: "t3",
    title: "Aesthetic POV / Mood",
    type: "Post Format",
    trendingAudio: "Summer Jazz Cafe",
    description: "POV (Point of View) text overlay showing a relatable lifestyle scenario.",
    relevanceReason: "Extremely shareable in stories, driving organic reach.",
    suggestedBrief: "POV: You find the perfect tote bag that actually fits your laptop, notebooks, and aesthetic."
  }
];

// GET /api/trends/matched
router.get('/matched', (req, res) => {
  res.json(mockTrends);
});

module.exports = router;
