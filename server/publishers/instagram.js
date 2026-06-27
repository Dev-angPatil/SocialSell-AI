/**
 * Instagram Graph API Publisher Module
 */

async function publishToInstagram({ caption, mediaUrl, accessToken, businessAccountId, onProgress }) {
  if (!caption || !mediaUrl) {
    throw new Error('Caption and Media URL are required for Instagram posts.');
  }

  const logProgress = (msg) => {
    console.log(`[Instagram Publisher] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  try {
    // 1. Check for token/account parameters
    if (!accessToken || !businessAccountId) {
      logProgress('⚠️ Meta Access Token or Instagram Business Account ID missing. Running simulation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      logProgress('📸 Step 1/2: Uploading media container to Meta servers (Simulated)...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      logProgress('🚀 Step 2/2: Publishing media container to Instagram Feed (Simulated)...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Published successfully (Simulated)',
        postId: `ig_simulated_post_${Date.now()}`,
        permalink: 'https://instagram.com'
      };
    }

    // 2. Step 1: Create Media Container
    logProgress('📸 Step 1/2: Requesting Meta to create media container for Instagram...');
    const containerRes = await fetch(
      `https://graph.facebook.com/v17.0/${businessAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaUrl,
          caption: caption,
          access_token: accessToken
        })
      }
    );

    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error) {
      const errorMsg = containerData.error?.message || 'Failed to create media container';
      throw new Error(`Meta Graph Error (Container Creation): ${errorMsg}`);
    }

    const containerId = containerData.id;
    logProgress(`✅ Media container created successfully (ID: ${containerId})`);
    
    // Simulate short wait for Meta processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Step 2: Publish the Media Container
    logProgress('🚀 Step 2/2: Triggering Instagram timeline publish...');
    const publishRes = await fetch(
      `https://graph.facebook.com/v17.0/${businessAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken
        })
      }
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error) {
      const errorMsg = publishData.error?.message || 'Failed to publish media container';
      throw new Error(`Meta Graph Error (Publishing): ${errorMsg}`);
    }

    logProgress(`🎉 Successfully published to Instagram timeline! Post ID: ${publishData.id}`);

    return {
      success: true,
      postId: publishData.id,
      permalink: `https://instagram.com/p/mock` // Meta Graph returns post ID, user can fetch link using GET /{post_id}?fields=permalink
    };

  } catch (error) {
    console.error('❌ Instagram Publishing Error:', error.message);
    throw error;
  }
}

module.exports = { publishToInstagram };
