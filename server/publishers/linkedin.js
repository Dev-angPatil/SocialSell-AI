/**
 * LinkedIn UGC Posts API Publisher Module
 */

async function publishToLinkedIn({ caption, accessToken, personId, onProgress }) {
  if (!caption) {
    throw new Error('Caption text is required for LinkedIn posts.');
  }

  const logProgress = (msg) => {
    console.log(`[LinkedIn Publisher] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  try {
    // 1. Check for token/account parameters
    if (!accessToken || !personId) {
      logProgress('⚠️ LinkedIn Access Token or URN Person ID missing. Running simulation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      logProgress('🔗 Step 1/2: Preparing LinkedIn UGC post request (Simulated)...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      logProgress('🚀 Step 2/2: Publishing post on LinkedIn Professional network (Simulated)...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Published successfully (Simulated)',
        postId: `li_simulated_post_${Date.now()}`
      };
    }

    logProgress('🔗 Step 1/2: Submitting post to LinkedIn UGC API...');
    const res = await fetch(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          author: `urn:li:person:${personId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: caption
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.message || 'Failed to submit post to LinkedIn';
      throw new Error(`LinkedIn API Error: ${errorMsg}`);
    }

    logProgress(`🚀 Step 2/2: Post published successfully! URN ID: ${data.id}`);

    return {
      success: true,
      postId: data.id
    };

  } catch (error) {
    console.error('❌ LinkedIn Publishing Error:', error.message);
    throw error;
  }
}

module.exports = { publishToLinkedIn };
