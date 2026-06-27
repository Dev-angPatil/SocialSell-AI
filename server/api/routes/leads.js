const express = require('express');
const router = express.Router();

// Mock qualified leads
const mockLeads = [
  {
    id: "l1",
    customerName: "Riya Sharma",
    handle: "@riya_s",
    platform: "Instagram",
    status: "hot", // hot, warm, cold, closed
    lastInteraction: "Purchased 'Summer Sundress' (L size) via auto-link. Asked if Blue color is available next week.",
    productInterest: "Summer Sundress",
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 mins ago
  },
  {
    id: "l2",
    customerName: "Amit Patel",
    handle: "@amit_patel",
    platform: "Facebook",
    status: "warm",
    lastInteraction: "Inquired about shipping to Mumbai. Bot confirmed free shipping. amit_patel received the checkout link but hasn't completed purchase.",
    productInterest: "Canvas Tote Bag",
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: "l3",
    customerName: "Sneha Kapoor",
    handle: "@sneha_k",
    platform: "Instagram",
    status: "hot",
    lastInteraction: "Commented 'PRICE' on Reel. Bot sent DM with price (₹1,499) + coupon. User replied: 'I want to buy 2. Can I get a discount?'",
    productInterest: "Summer Sundress",
    updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString() // 4 mins ago (Escalated to human)
  }
];

// GET /api/leads
router.get('/', (req, res) => {
  res.json(mockLeads);
});

// PUT /api/leads/:id (update status/notes)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  const leadIndex = mockLeads.findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  mockLeads[leadIndex] = {
    ...mockLeads[leadIndex],
    status: status || mockLeads[leadIndex].status,
    lastInteraction: notes || mockLeads[leadIndex].lastInteraction,
    updatedAt: new Date().toISOString()
  };

  res.json({ message: "Lead updated successfully", lead: mockLeads[leadIndex] });
});

module.exports = router;
