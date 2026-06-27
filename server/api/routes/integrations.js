const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const supabase = require('../../config/supabase');

// Mock memory store for local development when Supabase is not configured
global.mockIntegrations = global.mockIntegrations || [];

// GET /api/integrations - List all connected social accounts
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!supabase) {
      const userInts = global.mockIntegrations.filter(i => i.user_id === req.user.id);
      return res.json(userInts);
    }

    const { data, error } = await supabase
      .from('integrations')
      .select('id, platform, account_name, platform_account_id, created_at')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch integrations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/integrations/:id - Disconnect a platform
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      global.mockIntegrations = global.mockIntegrations.filter(i => !(i.id === id && i.user_id === req.user.id));
      return res.json({ success: true, message: 'Disconnected successfully.' });
    }

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Disconnected successfully.' });
  } catch (err) {
    console.error('Delete integration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. LINKEDIN OAUTH ENDPOINTS
// ==========================================

// GET /api/integrations/oauth/linkedin - Start LinkedIn Redirect
router.get('/oauth/linkedin', requireAuth, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/oauth/linkedin/callback`;
  const userId = req.user.id;

  // If Client ID is not configured, run simulated OAuth
  if (!clientId || clientId === 'YOUR_LINKEDIN_CLIENT_ID_HERE') {
    console.warn("⚠️ LinkedIn Client ID missing. Simulating OAuth callback redirect...");
    const redirectUrl = `/api/integrations/oauth/linkedin/callback?code=mock_code&state=${userId}`;
    return res.redirect(redirectUrl);
  }

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=w_member_social%20openid%20profile%20email&state=${userId}`;
  res.redirect(linkedinAuthUrl);
});

// GET /api/integrations/oauth/linkedin/callback - Handle LinkedIn OAuth Redirect
router.get('/oauth/linkedin/callback', async (req, res) => {
  const { code, state: userId, error, error_description } = req.query;

  if (error) {
    console.error('LinkedIn OAuth Error Callback:', error_description);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?error=${encodeURIComponent(error_description)}`);
  }

  try {
    let accountName = "Active Member Profile";
    let platformAccountId = `urn:li:person:mock_${Date.now()}`;
    let accessToken = "mock_access_token_" + Date.now();

    // Exchange code if not in simulation mode
    if (code && code !== 'mock_code') {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/oauth/linkedin/callback`;

      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange LinkedIn code.');
      }

      accessToken = tokenData.access_token;

      // Fetch User Info
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const userData = await userRes.json();
      if (userRes.ok) {
        accountName = `${userData.given_name} ${userData.family_name}`;
        platformAccountId = `urn:li:person:${userData.sub}`;
      }
    } else {
      // Custom mock profile details for offline testing
      accountName = "Devang Patil (Linked Member)";
    }

    // Save/Upsert Integration
    const integrationData = {
      id: `int-${Date.now()}`,
      user_id: userId,
      platform: 'linkedin',
      account_name: accountName,
      access_token: accessToken,
      platform_account_id: platformAccountId,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      // Remove any existing LinkedIn integration for this user
      global.mockIntegrations = global.mockIntegrations.filter(i => !(i.user_id === userId && i.platform === 'linkedin'));
      global.mockIntegrations.push(integrationData);
    } else {
      // Delete existing to support Upsert logic safely
      await supabase
        .from('integrations')
        .delete()
        .eq('user_id', userId)
        .eq('platform', 'linkedin');

      const { id, ...insertData } = integrationData;
      const { error: dbErr } = await supabase
        .from('integrations')
        .insert([insertData]);
      if (dbErr) throw dbErr;
    }

    // Redirect user back to Profile Settings
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?tab=profile`);

  } catch (err) {
    console.error('LinkedIn Callback Handling Error:', err);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?tab=profile&error=linkedin_oauth_failed`);
  }
});

// ==========================================
// 2. FACEBOOK/INSTAGRAM OAUTH ENDPOINTS
// ==========================================

// GET /api/integrations/oauth/facebook - Start Facebook Redirect
router.get('/oauth/facebook', requireAuth, (req, res) => {
  const clientId = process.env.META_APP_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/oauth/facebook/callback`;
  const userId = req.user.id;

  // If Client ID is not configured, run simulated OAuth
  if (!clientId || clientId === 'YOUR_META_APP_ID_HERE') {
    console.warn("⚠️ Meta App ID missing. Simulating OAuth callback redirect...");
    const redirectUrl = `/api/integrations/oauth/facebook/callback?code=mock_code&state=${userId}`;
    return res.redirect(redirectUrl);
  }

  const facebookAuthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&state=${userId}`;
  res.redirect(facebookAuthUrl);
});

// GET /api/integrations/oauth/facebook/callback - Handle Facebook Callback
router.get('/oauth/facebook/callback', async (req, res) => {
  const { code, state: userId, error, error_description } = req.query;

  if (error) {
    console.error('Facebook OAuth Error Callback:', error_description);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?tab=profile&error=${encodeURIComponent(error_description)}`);
  }

  try {
    let accountName = "Active Business Account";
    let platformAccountId = `ig_biz_mock_${Date.now()}`;
    let accessToken = "mock_meta_token_" + Date.now();

    if (code && code !== 'mock_code') {
      const clientId = process.env.META_APP_ID;
      const clientSecret = process.env.META_APP_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/oauth/facebook/callback`;

      // Exchange code
      const tokenRes = await fetch(
        `https://graph.facebook.com/v17.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error?.message || 'Failed to exchange Meta code.');
      }

      accessToken = tokenData.access_token;

      // 1. Fetch User's Facebook Pages
      const pagesRes = await fetch(`https://graph.facebook.com/v17.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      if (!pagesRes.ok) throw new Error("Failed to load Meta Pages.");

      // Find first page that has a linked Instagram Business Account
      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          const pageId = page.id;
          const pageToken = page.access_token;

          const igRes = await fetch(`https://graph.facebook.com/v17.0/${pageId}?fields=instagram_business_account,name&access_token=${pageToken}`);
          const igData = await igRes.json();
          
          if (igData.instagram_business_account) {
            platformAccountId = igData.instagram_business_account.id;
            accountName = `${igData.name} (Instagram Business)`;
            // We store the specific page access token since it is long-lived
            accessToken = pageToken;
            break;
          }
        }
      }
    } else {
      // Mock defaults for previewing offline
      accountName = "SocialSell Brand (Instagram)";
    }

    // Save/Upsert Integration
    const integrationData = {
      id: `int-${Date.now()}`,
      user_id: userId,
      platform: 'instagram',
      account_name: accountName,
      access_token: accessToken,
      platform_account_id: platformAccountId,
      created_at: new Date().toISOString()
    };

    if (!supabase) {
      global.mockIntegrations = global.mockIntegrations.filter(i => !(i.user_id === userId && i.platform === 'instagram'));
      global.mockIntegrations.push(integrationData);
    } else {
      await supabase
        .from('integrations')
        .delete()
        .eq('user_id', userId)
        .eq('platform', 'instagram');

      const { id, ...insertData } = integrationData;
      const { error: dbErr } = await supabase
        .from('integrations')
        .insert([insertData]);
      if (dbErr) throw dbErr;
    }

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?tab=profile`);

  } catch (err) {
    console.error('Facebook Callback Handling Error:', err);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?tab=profile&error=meta_oauth_failed`);
  }
});

module.exports = router;
