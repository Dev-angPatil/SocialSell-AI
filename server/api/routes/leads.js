const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { requireAuth } = require('../../middleware/auth');

// Protect all lead routes
router.use(requireAuth);

// ─── Lead Scoring Helper ────────────────────────────────────────────────────

const INTENT_BASE_SCORES = {
  buying_signal: 90,
  price_inquiry: 70,
  availability: 60,
  location: 40,
  faq: 20,
  unrecognized: 10
};

const PRICE_KEYWORDS = ['price', 'cost', 'how much', '₹', '$', 'discount', 'deal', 'offer', 'cheapest', 'rate'];

/**
 * Calculate lead score based on intent, conversation history, message content, and time.
 * @param {string} intent - Intent category
 * @param {Array} conversation - Array of {role, message, timestamp}
 * @param {string} messageText - The latest incoming message text
 * @returns {number} Score 0-100
 */
function calculateLeadScore(intent, conversation = [], messageText = '') {
  let score = INTENT_BASE_SCORES[intent] || 10;

  // +10 if they've sent multiple messages
  if (conversation.length > 1) {
    score += 10;
  }

  // +10 if message contains price-related keywords
  const lowerMsg = (messageText || '').toLowerCase();
  if (PRICE_KEYWORDS.some(kw => lowerMsg.includes(kw))) {
    score += 10;
  }

  // +5 if within business hours (9 AM – 6 PM in local timezone)
  const currentHour = new Date().getHours();
  if (currentHour >= 9 && currentHour < 18) {
    score += 5;
  }

  // Cap at 100
  return Math.min(score, 100);
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockLeads = [
  {
    id: "lead-001",
    user_id: "mock-user-id-123",
    platform: "instagram",
    contact_name: "Riya Sharma",
    contact_handle: "@riya_s",
    contact_id: "ig_riya_001",
    source_post_id: null,
    intent: "buying_signal",
    score: 95,
    status: "qualified",
    conversation: [
      { role: "customer", message: "I want to buy the Summer Sundress in blue!", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Great choice! The Summer Sundress is ₹1,499. Here's your checkout link: https://socialsell.ai/checkout/sd01", timestamp: new Date(Date.now() - 2.9 * 60 * 60 * 1000).toISOString() },
      { role: "customer", message: "Can I get 2 at a discount?", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
    ],
    notes: "High-value buyer, wants bulk discount",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: "lead-002",
    user_id: "mock-user-id-123",
    platform: "facebook",
    contact_name: "Amit Patel",
    contact_handle: "@amit_patel",
    contact_id: "fb_amit_002",
    source_post_id: null,
    intent: "price_inquiry",
    score: 70,
    status: "contacted",
    conversation: [
      { role: "customer", message: "How much is the Canvas Tote Bag? Does it ship to Mumbai?", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hi Amit! The Canvas Tote Bag is ₹799 with free shipping across India, including Mumbai! DM us to order 🎉", timestamp: new Date(Date.now() - 4.9 * 60 * 60 * 1000).toISOString() }
    ],
    notes: null,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-003",
    user_id: "mock-user-id-123",
    platform: "instagram",
    contact_name: "Sneha Kapoor",
    contact_handle: "@sneha_k",
    contact_id: "ig_sneha_003",
    source_post_id: null,
    intent: "buying_signal",
    score: 100,
    status: "new",
    conversation: [
      { role: "customer", message: "PRICE", timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hey Sneha! The Summer Sundress is ₹1,499. Use code FLASH10 for 10% off! 🌸", timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString() },
      { role: "customer", message: "I want to buy 2. Can I get a discount?", timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString() }
    ],
    notes: "Escalated to human — bulk order request",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: "lead-004",
    user_id: "mock-user-id-123",
    platform: "instagram",
    contact_name: "Priya Menon",
    contact_handle: "@priya.menon",
    contact_id: "ig_priya_004",
    source_post_id: null,
    intent: "availability",
    score: 60,
    status: "new",
    conversation: [
      { role: "customer", message: "Is the tote bag available in green?", timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hi Priya! The Canvas Tote is currently in Beige and Black. Green is coming next month! Want us to notify you?", timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString() }
    ],
    notes: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 55 * 60 * 1000).toISOString()
  },
  {
    id: "lead-005",
    user_id: "mock-user-id-123",
    platform: "facebook",
    contact_name: "Rahul Verma",
    contact_handle: "rahul.verma.fb",
    contact_id: "fb_rahul_005",
    source_post_id: null,
    intent: "location",
    score: 40,
    status: "new",
    conversation: [
      { role: "customer", message: "Do you have a store in Bangalore?", timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hey Rahul! We're online-only right now, but we ship free across India. Check our collection at socialsell.ai/shop!", timestamp: new Date(Date.now() - 7.9 * 60 * 60 * 1000).toISOString() }
    ],
    notes: null,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7.9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-006",
    user_id: "mock-user-id-123",
    platform: "linkedin",
    contact_name: "Ananya Desai",
    contact_handle: "ananya-desai-linkedin",
    contact_id: "li_ananya_006",
    source_post_id: null,
    intent: "faq",
    score: 20,
    status: "new",
    conversation: [
      { role: "customer", message: "What material is the sundress made of?", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hi Ananya! The Summer Sundress is 100% cotton with a breathable linen blend. Perfect for hot weather! 🌞", timestamp: new Date(Date.now() - 23.9 * 60 * 60 * 1000).toISOString() }
    ],
    notes: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 23.9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-007",
    user_id: "mock-user-id-123",
    platform: "instagram",
    contact_name: "Karan Singh",
    contact_handle: "@karan.singh",
    contact_id: "ig_karan_007",
    source_post_id: null,
    intent: "buying_signal",
    score: 90,
    status: "converted",
    conversation: [
      { role: "customer", message: "I love the tote bag! How do I order?", timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Thanks Karan! Here's your checkout link: https://socialsell.ai/checkout/tb01. Free shipping included! 🚀", timestamp: new Date(Date.now() - 47.9 * 60 * 60 * 1000).toISOString() },
      { role: "customer", message: "Done! Just placed the order 🎉", timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString() }
    ],
    notes: "Converted — order confirmed via DM",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-008",
    user_id: "mock-user-id-123",
    platform: "facebook",
    contact_name: "Meera Joshi",
    contact_handle: "meera.joshi.fb",
    contact_id: "fb_meera_008",
    source_post_id: null,
    intent: "price_inquiry",
    score: 80,
    status: "contacted",
    conversation: [
      { role: "customer", message: "What's the cost of the sundress? Any ongoing offers?", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hi Meera! The Summer Sundress is ₹1,499. Use code SUMMER15 for 15% off this week only! 🌺", timestamp: new Date(Date.now() - 5.9 * 60 * 60 * 1000).toISOString() },
      { role: "customer", message: "That's great! Applying the code now", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
    ],
    notes: "Offered SUMMER15 coupon",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-009",
    user_id: "mock-user-id-123",
    platform: "instagram",
    contact_name: "Vikram Rao",
    contact_handle: "@vikram_rao",
    contact_id: "ig_vikram_009",
    source_post_id: null,
    intent: "unrecognized",
    score: 10,
    status: "lost",
    conversation: [
      { role: "customer", message: "Nice pic 🔥", timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Thanks Vikram! Check out our full collection at socialsell.ai/shop 🛍️", timestamp: new Date(Date.now() - 71.9 * 60 * 60 * 1000).toISOString() }
    ],
    notes: "No buying intent — casual engagement only",
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 71.9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "lead-010",
    user_id: "mock-user-id-123",
    platform: "instagram",
    contact_name: "Divya Nair",
    contact_handle: "@divya.nair",
    contact_id: "ig_divya_010",
    source_post_id: null,
    intent: "availability",
    score: 75,
    status: "qualified",
    conversation: [
      { role: "customer", message: "Is the sundress available in size XL?", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "Hi Divya! Yes, the Summer Sundress is available in S, M, L, and XL. Want a checkout link?", timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString() },
      { role: "customer", message: "Yes please! Also how much does it cost?", timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() },
      { role: "bot", message: "It's ₹1,499! Here you go: https://socialsell.ai/checkout/sd01-xl 🎉", timestamp: new Date(Date.now() - 1.4 * 60 * 60 * 1000).toISOString() }
    ],
    notes: "Size XL confirmed, checkout link sent",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1.4 * 60 * 60 * 1000).toISOString()
  }
];

// ─── GET /api/leads/stats — Lead statistics ─────────────────────────────────
// NOTE: Defined BEFORE /:id to avoid Express matching "stats" as an id param
router.get('/stats', async (req, res) => {
  try {
    if (!supabase) {
      const userLeads = mockLeads.filter(l => l.user_id === req.user.id);
      const total = userLeads.length;

      const byStatus = {};
      const byPlatform = {};
      userLeads.forEach(l => {
        byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        byPlatform[l.platform] = (byPlatform[l.platform] || 0) + 1;
      });

      const converted = byStatus['converted'] || 0;
      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

      return res.json({
        total,
        byStatus,
        byPlatform,
        conversionRate,
        avgScore: total > 0 ? Math.round(userLeads.reduce((sum, l) => sum + l.score, 0) / total) : 0
      });
    }

    // Real Supabase: fetch all leads for user and compute stats server-side
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, platform, score')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const total = leads.length;
    const byStatus = {};
    const byPlatform = {};
    leads.forEach(l => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      byPlatform[l.platform] = (byPlatform[l.platform] || 0) + 1;
    });

    const converted = byStatus['converted'] || 0;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    res.json({
      total,
      byStatus,
      byPlatform,
      conversionRate,
      avgScore: total > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / total) : 0
    });
  } catch (err) {
    console.error('Lead stats error:', err);
    res.status(500).json({ error: 'Internal server error fetching lead stats' });
  }
});

// ─── GET /api/leads — List leads with optional filters ──────────────────────
router.get('/', async (req, res) => {
  const { status, platform, from, to } = req.query;

  try {
    if (!supabase) {
      let filtered = mockLeads.filter(l => l.user_id === req.user.id);

      if (status) filtered = filtered.filter(l => l.status === status);
      if (platform) filtered = filtered.filter(l => l.platform === platform);
      if (from) filtered = filtered.filter(l => new Date(l.created_at) >= new Date(from));
      if (to) filtered = filtered.filter(l => new Date(l.created_at) <= new Date(to));

      // Sort by score descending
      filtered.sort((a, b) => b.score - a.score);

      return res.json(filtered);
    }

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user.id)
      .order('score', { ascending: false });

    if (status) query = query.eq('status', status);
    if (platform) query = query.eq('platform', platform);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Fetch leads error:', err);
    res.status(500).json({ error: 'Internal server error fetching leads' });
  }
});

// ─── GET /api/leads/:id — Get single lead with conversation history ─────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      const lead = mockLeads.find(l => l.id === id && l.user_id === req.user.id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.json(lead);
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Fetch lead error:', err);
    res.status(500).json({ error: 'Internal server error fetching lead' });
  }
});

// ─── PUT /api/leads/:id — Update lead (status, notes, score) ────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes, score } = req.body;

  try {
    if (!supabase) {
      const leadIdx = mockLeads.findIndex(l => l.id === id && l.user_id === req.user.id);
      if (leadIdx === -1) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const updated = {
        ...mockLeads[leadIdx],
        status: status !== undefined ? status : mockLeads[leadIdx].status,
        notes: notes !== undefined ? notes : mockLeads[leadIdx].notes,
        score: score !== undefined ? score : mockLeads[leadIdx].score,
        updated_at: new Date().toISOString()
      };
      mockLeads[leadIdx] = updated;

      return res.json({ message: 'Lead updated successfully', lead: updated });
    }

    const updatePayload = {};
    if (status !== undefined) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes;
    if (score !== undefined) updatePayload.score = score;

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Lead updated successfully', lead: data });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: 'Internal server error updating lead' });
  }
});

// ─── DELETE /api/leads/:id — Delete a lead ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      const leadIdx = mockLeads.findIndex(l => l.id === id && l.user_id === req.user.id);
      if (leadIdx === -1) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      mockLeads.splice(leadIdx, 1);
      return res.json({ message: 'Lead deleted successfully' });
    }

    const { data, error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ error: 'Internal server error deleting lead' });
  }
});

// Export the scoring function for use in webhooks
module.exports = router;
module.exports.calculateLeadScore = calculateLeadScore;
