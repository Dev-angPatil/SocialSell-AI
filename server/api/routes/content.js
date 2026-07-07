const express = require('express');
const router = express.Router();
const path = require('path');
const { requireAuth } = require('../../middleware/auth');
const { analyzeMediaAsset } = require('../../services/mediaAnalyzer');
const supabase = require('../../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const { schedulePublishJob } = require('../../scheduler/scheduler');

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

// PUT /api/content/drafts/:id - Update copy or schedule of a draft in the queue
router.put('/drafts/:id', async (req, res) => {
  const { id } = req.params;
  const { caption, hashtags, cta, platform, status, scheduled_at, scheduledAt } = req.body;

  const resolvedScheduledAt = scheduled_at || scheduledAt;

  try {
    if (!supabase) {
      const postIdx = global.mockPosts.findIndex(p => p.id === id && p.user_id === req.user.id);
      if (postIdx === -1) return res.status(404).json({ error: 'Draft not found.' });

      const updated = {
        ...global.mockPosts[postIdx],
        caption: caption !== undefined ? caption : global.mockPosts[postIdx].caption,
        hashtags: hashtags !== undefined ? hashtags : global.mockPosts[postIdx].hashtags,
        cta: cta !== undefined ? cta : global.mockPosts[postIdx].cta,
        platform: platform !== undefined ? platform : global.mockPosts[postIdx].platform,
        status: status !== undefined ? status : global.mockPosts[postIdx].status,
        scheduled_at: resolvedScheduledAt !== undefined ? resolvedScheduledAt : global.mockPosts[postIdx].scheduled_at,
        scheduledAt: resolvedScheduledAt !== undefined ? resolvedScheduledAt : global.mockPosts[postIdx].scheduledAt
      };
      global.mockPosts[postIdx] = updated;

      if (updated.status === 'scheduled' && updated.scheduled_at) {
        await schedulePublishJob(updated);
      }

      return res.json(updated);
    }

    const updateData = {};
    if (caption !== undefined) updateData.caption = caption;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (cta !== undefined) updateData.cta = cta;
    if (platform !== undefined) updateData.platform = platform;
    if (status !== undefined) updateData.status = status;
    if (resolvedScheduledAt !== undefined) updateData.scheduled_at = resolvedScheduledAt;

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    if (data.status === 'scheduled' && data.scheduled_at) {
      await schedulePublishJob(data);
    }

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

// POST /api/content/drafts/:id/variant - Generate an A/B alternative variant of a draft
router.post('/drafts/:id/variant', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch current draft details
    let existingPost;
    if (!supabase) {
      existingPost = global.mockPosts.find(p => p.id === id && p.user_id === req.user.id);
    } else {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();
      
      if (!error) existingPost = data;
    }

    if (!existingPost) {
      return res.status(404).json({ error: 'Draft not found or unauthorized.' });
    }

    // 2. Load business profile details
    let profile = null;
    if (!supabase) {
      profile = {
        company_name: 'Our Shop',
        niche: 'Retail',
        about: 'Premium eco-friendly essentials',
        branding_guidelines: 'Friendly and professional tone'
      };
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
      
      if (!error) profile = data;
    }

    const brandName = profile?.company_name || 'Our Shop';
    let alternativeCaption = "";
    let alternativeHashtags = existingPost.hashtags || "";
    let alternativeCta = existingPost.cta || "";

    // 3. Generate alternative via Gemini
    if (!genAI) {
      console.warn("⚠️ Gemini API not configured. Creating simulated A/B variant.");
      alternativeCaption = `✨ [Variant B] ✨\n\nLooking for a fresh spin on our favorite essentials? \n\n${existingPost.caption}\n\nHandcrafted with love from ${brandName}.`;
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        You are SocialSell AI, a marketing copywriter.
        We have an existing draft post for ${existingPost.platform}:
        - Original Caption: "${existingPost.caption}"
        - Original Hashtags: "${existingPost.hashtags || ''}"
        - Original CTA: "${existingPost.cta || ''}"

        Brand Context:
        - Name: ${brandName}
        - Niche: ${profile?.niche || 'retail'}
        - Guidelines: ${profile?.branding_guidelines || 'professional'}

        Create an alternative A/B test variant (Variant B) of this caption.
        Make it write from a different creative angle (e.g. if the original is educational, make the variant punchy and discount-focused; if the original is casual, make the variant professional or story-telling). Keep the length suitable for ${existingPost.platform}.

        Provide your response in JSON format matching this exact schema:
        {
          "caption": "Alternative caption text...",
          "hashtags": "Hashtags space separated...",
          "cta": "Call to action..."
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(result.response.text());
      alternativeCaption = parsed.caption;
      alternativeHashtags = parsed.hashtags || alternativeHashtags;
      alternativeCta = parsed.cta || alternativeCta;
    }

    // 4. Assemble and insert variant draft
    const variantPost = {
      user_id: req.user.id,
      asset_id: existingPost.asset_id,
      platform: existingPost.platform,
      caption: alternativeCaption,
      hashtags: alternativeHashtags,
      cta: alternativeCta,
      media_url: existingPost.media_url,
      status: 'draft',
      classification_reason: `A/B Variant B generated as alternative to draft ${existingPost.id}.`,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      variantPost.id = `post-variant-${Date.now()}`;
      global.mockPosts.unshift(variantPost);
      return res.status(201).json(variantPost);
    }

    const { data: insertedVariant, error: insertError } = await supabase
      .from('posts')
      .insert([variantPost])
      .select()
      .single();

    if (insertError) throw insertError;
    res.status(201).json(insertedVariant);

  } catch (err) {
    console.error('Create post variant error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
