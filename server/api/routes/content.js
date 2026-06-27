const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth } = require('../../middleware/auth');
const { analyzeMediaAsset } = require('../../services/mediaAnalyzer');
const supabase = require('../../config/supabase');

// Shared memory stores for local offline development
global.mockPosts = global.mockPosts || [];
global.mockAssets = global.mockAssets || [];

// Protect all content routes
router.use(requireAuth);

// GET /api/content/queue - Get the post review queue
router.get('/queue', async (req, res) => {
  try {
    if (!supabase) {
      const userPosts = global.mockPosts.filter(p => p.user_id === req.user.id);
      return res.json(userPosts);
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch post queue error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/content/analyze-asset/:assetId - Analyze an uploaded asset and create a review draft
router.post('/analyze-asset/:assetId', async (req, res) => {
  const { assetId } = req.params;

  try {
    // 1. Fetch asset details
    let asset;
    if (!supabase) {
      asset = global.mockAssets.find(a => a.id === assetId && a.user_id === req.user.id);
    } else {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', req.user.id)
        .single();
      
      if (!error) asset = data;
    }

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found or unauthorized.' });
    }

    // 2. Fetch business profile details
    let profile = null;
    if (!supabase) {
      // Import/fetch default mock profile
      profile = {
        company_name: 'Our Shop',
        niche: 'Lifestyle products',
        about: 'Premium eco-friendly essentials for daily life',
        branding_guidelines: 'Energetic, modern, high quality'
      };
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      
      if (!error) profile = data;
    }

    // 3. Resolve local file path
    const fileName = path.basename(asset.file_url);
    const localFilePath = path.join(__dirname, '../../uploads', fileName);

    // 4. Trigger Gemini Multimodal analysis
    const analysis = await analyzeMediaAsset({
      filePath: localFilePath,
      mimeType: asset.file_type,
      companyProfile: profile
    });

    // 5. Assemble draft post entry
    const postData = {
      id: `post-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      user_id: req.user.id,
      asset_id: asset.id,
      platform: analysis.selected_platform,
      caption: analysis.caption,
      hashtags: analysis.hashtags,
      cta: analysis.cta,
      media_url: asset.file_url,
      status: 'draft',
      classification_reason: analysis.classification_reason,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      global.mockPosts.unshift(postData);
      return res.status(201).json(postData);
    }

    // Insert to Supabase (Omit local ID so Postgres generates UUID)
    const { id, ...supabaseInsertData } = postData;
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        ...supabaseInsertData,
        user_id: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (err) {
    console.error('Analyze asset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content/drafts/:id - Update copy of a draft in the queue
router.put('/drafts/:id', async (req, res) => {
  const { id } = req.params;
  const { caption, hashtags, cta, platform } = req.body;

  try {
    if (!supabase) {
      const postIdx = global.mockPosts.findIndex(p => p.id === id && p.user_id === req.user.id);
      if (postIdx === -1) return res.status(404).json({ error: 'Draft not found.' });

      const updated = {
        ...global.mockPosts[postIdx],
        caption: caption !== undefined ? caption : global.mockPosts[postIdx].caption,
        hashtags: hashtags !== undefined ? hashtags : global.mockPosts[postIdx].hashtags,
        cta: cta !== undefined ? cta : global.mockPosts[postIdx].cta,
        platform: platform !== undefined ? platform : global.mockPosts[postIdx].platform
      };
      global.mockPosts[postIdx] = updated;
      return res.json(updated);
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ caption, hashtags, cta, platform })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Update draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/content/drafts/:id - Delete a draft
router.delete('/drafts/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      global.mockPosts = global.mockPosts.filter(p => !(p.id === id && p.user_id === req.user.id));
      return res.json({ success: true, message: 'Draft deleted.' });
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Draft deleted.' });
  } catch (err) {
    console.error('Delete draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
