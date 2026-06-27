const express = require('express');
const router = express.Router();

// Mock in-memory database for local development/demo
let businessProfile = {
  name: "Mock Brand",
  niche: "Women's Fashion",
  products: [
    { id: 1, name: "Summer Sundress", price: "₹1,499", description: "Light and breezy floral sundress" },
    { id: 2, name: "Canvas Tote Bag", price: "₹799", description: "Eco-friendly aesthetic everyday carry tote" }
  ],
  tone: "Playful & Vibrant",
  target_audience: "Gen-Z & Millennials, 18-34 years old",
  cta_style: "DM us to order"
};

// GET /api/profile
router.get('/', (req, res) => {
  res.json(businessProfile);
});

// PUT /api/profile
router.put('/', (req, res) => {
  const { name, niche, products, tone, target_audience, cta_style } = req.body;
  
  businessProfile = {
    ...businessProfile,
    name: name || businessProfile.name,
    niche: niche || businessProfile.niche,
    products: products || businessProfile.products,
    tone: tone || businessProfile.tone,
    target_audience: target_audience || businessProfile.target_audience,
    cta_style: cta_style || businessProfile.cta_style
  };
  
  res.json({ message: "Profile updated successfully", profile: businessProfile });
});

module.exports = router;
