const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { requireAuth } = require('../../middleware/auth');

// Apply requireAuth middleware to protect all profile endpoints
router.use(requireAuth);

// Mock profile for offline testing (when Supabase URL/key are not set in .env)
let mockProfile = {
  company_name: "Mock Brand Co.",
  niche: "Sustainable Fashion",
  about: "We design everyday carry canvas totes and eco-friendly dresses.",
  promote_type: "products",
  promote_details: "promoting our Summer Sundress line and Tote bags",
  audience_type: "specified",
  audience_details: "Gen-Z & Millennials who love aesthetic eco-friendly products",
  region: "India (Metros)",
  social_links: { instagram: "https://instagram.com/mock", facebook: "https://facebook.com/mock", linkedin: "https://linkedin.com/company/mock" },
  branding_guidelines: "Keep it bold, minimalist, and environment-friendly. Avoid generic hashtags.",
  past_posts: [
    { platform: "Instagram", caption: "Eco-friendly never looked this good! 🌿✨ Grab your tote bag today." }
  ]
};

let mockProducts = [
  { id: 1, name: "Summer Sundress", price: "₹1,499", description: "Light and breezy floral sundress" },
  { id: 2, name: "Canvas Tote Bag", price: "₹799", description: "Eco-friendly aesthetic everyday carry tote" }
];

// GET /api/profile - Fetch profile details and related products
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    if (!supabase) {
      console.warn("⚠️ Supabase not configured. Returning mock profile.");
      return res.json({
        ...mockProfile,
        products: mockProducts
      });
    }

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Single row not found: profile doesn't exist yet (or trigger hasn't fired)
        // Let's create an empty profile row now
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, company_name: req.user.email.split('@')[0] })
          .select()
          .single();

        if (insertError) {
          return res.status(400).json({ error: insertError.message });
        }

        return res.json({ ...newProfile, products: [] });
      }
      return res.status(400).json({ error: profileError.message });
    }

    // 2. Fetch Products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('profile_id', userId);

    if (productsError) {
      return res.status(400).json({ error: productsError.message });
    }

    res.json({
      ...profile,
      products: products || []
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Internal server error fetching profile' });
  }
});

// PUT /api/profile - Update profile details
router.put('/', async (req, res) => {
  const userId = req.user.id;
  const {
    company_name,
    niche,
    about,
    promote_type,
    promote_details,
    audience_type,
    audience_details,
    region,
    social_links,
    branding_guidelines,
    past_posts
  } = req.body;

  try {
    if (!supabase) {
      mockProfile = {
        ...mockProfile,
        company_name, niche, about, promote_type, promote_details,
        audience_type, audience_details, region, social_links, branding_guidelines, past_posts
      };
      return res.json({ message: "Mock profile updated successfully", profile: mockProfile });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        company_name,
        niche,
        about,
        promote_type,
        promote_details,
        audience_type,
        audience_details,
        region,
        social_links,
        branding_guidelines,
        past_posts,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Profile updated successfully", profile: data });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error updating profile' });
  }
});

// POST /api/profile/products - Add product to catalog
router.post('/products', async (req, res) => {
  const userId = req.user.id;
  const { name, price, description } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "Product name and price are required" });
  }

  try {
    if (!supabase) {
      const newMockProd = { id: Date.now(), name, price, description };
      mockProducts.push(newMockProd);
      return res.status(201).json({ message: "Mock product added", product: newMockProd });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        profile_id: userId,
        name,
        price,
        description
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Product added successfully", product: data });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ error: 'Internal server error adding product' });
  }
});

// DELETE /api/profile/products/:id - Remove product from catalog
router.delete('/products/:id', async (req, res) => {
  const userId = req.user.id;
  const productId = req.params.id;

  try {
    if (!supabase) {
      mockProducts = mockProducts.filter(p => p.id.toString() !== productId.toString());
      return res.json({ message: "Mock product deleted successfully" });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('profile_id', userId); // Security check to ensure owner is deleting it

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Internal server error deleting product' });
  }
});

module.exports = router;
