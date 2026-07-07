const { supabase } = require('../config/supabase');
const { publishToInstagram } = require('../publishers/instagram');
const { publishToLinkedIn } = require('../publishers/linkedin');

// Shared mock database fallback
global.mockPosts = global.mockPosts || [];
global.mockIntegrations = global.mockIntegrations || [];

/**
 * Core service to publish a post to Instagram or LinkedIn.
 * Handles database token loading, API publishing, and updating status.
 * Supports progress updates via an optional callback.
 * 
 * @param {object} params
 * @param {string} params.postId - ID of the post to publish
 * @param {string} params.userId - User ID of the post owner
 * @param {function} [params.onProgress] - Callback function for progress logging (step, detail, status)
 * @returns {Promise<object>} Result of the publishing operation
 */
async function publishPost({ postId, userId, onProgress }) {
  const logProgress = (step, detail, status = 'in_progress') => {
    console.log(`[Publisher Service] [${step}] ${detail}`);
    if (onProgress) {
      onProgress(step, detail, status);
    }
  };

  try {
    logProgress('Fetch Draft', 'Loading draft details...', 'in_progress');

    // 1. Load the post details
    let post = null;
    if (!supabase) {
      post = global.mockPosts.find(p => p.id === postId && p.user_id === userId);
    } else {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', userId)
        .single();
      
      if (!error) post = data;
    }

    if (!post) {
      throw new Error(`Post ${postId} not found or unauthorized.`);
    }

    if (post.status === 'published') {
      throw new Error('This post has already been published.');
    }

    logProgress('Auth Verification', 'Checking session authorization and active integrations...', 'in_progress');

    // 2. Fetch User Profile to check for social tokens
    let metaToken = process.env.META_ACCESS_TOKEN || null;
    let metaAccountId = process.env.META_BUSINESS_ACCOUNT_ID || null;
    let linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
    let linkedinPersonId = process.env.LINKEDIN_PERSON_ID || null;

    if (!supabase) {
      const integrations = global.mockIntegrations.filter(i => i.user_id === userId);
      const ig = integrations.find(i => i.platform === 'instagram');
      const li = integrations.find(i => i.platform === 'linkedin');
      
      if (ig) {
        metaToken = ig.access_token;
        metaAccountId = ig.platform_account_id;
      }
      if (li) {
        linkedinToken = li.access_token;
        linkedinPersonId = li.platform_account_id;
      }
    } else {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId);
      
      if (!error && integrations) {
        const ig = integrations.find(i => i.platform === 'instagram');
        const li = integrations.find(i => i.platform === 'linkedin');
        
        if (ig) {
          metaToken = ig.access_token;
          metaAccountId = ig.platform_account_id;
        }
        if (li) {
          linkedinToken = li.access_token;
          linkedinPersonId = li.platform_account_id;
        }
      }
    }

    // Adapt caption: append hashtags if they exist
    const fullCaption = post.caption + (post.hashtags ? `\n\n${post.hashtags}` : "");
    let result = null;

    // 3. Publish to target platform
    if (post.platform.toLowerCase().includes('instagram')) {
      logProgress('Instagram Post Queue', 'Initializing Instagram publishing sequence...', 'in_progress');
      
      result = await publishToInstagram({
        caption: fullCaption,
        mediaUrl: post.media_url,
        accessToken: metaToken,
        businessAccountId: metaAccountId,
        onProgress: (detail) => logProgress('Instagram Publishing', detail, 'in_progress')
      });
    } else if (post.platform.toLowerCase().includes('linkedin')) {
      logProgress('LinkedIn Post Queue', 'Initializing LinkedIn social share...', 'in_progress');

      result = await publishToLinkedIn({
        caption: fullCaption,
        accessToken: linkedinToken,
        personId: linkedinPersonId,
        onProgress: (detail) => logProgress('LinkedIn Publishing', detail, 'in_progress')
      });
    } else {
      throw new Error(`Unsupported platform: ${post.platform}`);
    }

    // 4. Update status to published
    logProgress('Database Update', 'Updating post status in database...', 'in_progress');
    
    if (!supabase) {
      const postIdx = global.mockPosts.findIndex(p => p.id === postId);
      if (postIdx !== -1) {
        global.mockPosts[postIdx].status = 'published';
        global.mockPosts[postIdx].published_at = new Date().toISOString();
      }
    } else {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ status: 'published' })
        .eq('id', postId);
      
      if (updateError) throw updateError;
    }

    logProgress('Complete', `🎉 Success! Published to ${post.platform}. Post ID: ${result.postId}`, 'success');
    
    return {
      success: true,
      postId: result.postId,
      platform: post.platform
    };

  } catch (error) {
    console.error('Publisher Service error:', error);
    
    // Mark status as failed in database
    try {
      if (!supabase) {
        const postIdx = global.mockPosts.findIndex(p => p.id === postId);
        if (postIdx !== -1) {
          global.mockPosts[postIdx].status = 'failed';
        }
      } else {
        await supabase
          .from('posts')
          .update({ status: 'failed' })
          .eq('id', postId);
      }
    } catch (dbErr) {
      console.error('Failed to update post status to failed:', dbErr);
    }

    logProgress('Error', `❌ Publishing Failed: ${error.message}`, 'failed');
    throw error;
  }
}

module.exports = { publishPost };
