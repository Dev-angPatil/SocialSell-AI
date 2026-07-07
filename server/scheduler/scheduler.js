const { Queue, Worker } = require('bullmq');
const { supabase } = require('../config/supabase');
const { publishPost } = require('../services/publisherService');

// Shared mock database fallback
global.mockPosts = global.mockPosts || [];

let publishQueue = null;
let queueWorker = null;
let pollInterval = null;

/**
 * Initialize BullMQ Queue if Redis URL is available.
 */
function initBullMQ() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('[Scheduler] ℹ️ REDIS_URL not configured. BullMQ skipped, falling back to database polling scheduler.');
    return;
  }

  try {
    console.log(`[Scheduler] 🔌 Connecting to Redis at ${redisUrl}...`);
    
    // Parse redis connection options
    const connectionOptions = {
      connection: {
        url: redisUrl
      }
    };

    publishQueue = new Queue('SocialSellPublishQueue', connectionOptions);
    
    queueWorker = new Worker('SocialSellPublishQueue', async (job) => {
      const { postId, userId } = job.data;
      console.log(`[BullMQ Worker] 📦 Processing job ${job.id} for post ${postId}`);
      
      try {
        await publishPost({
          postId,
          userId,
          onProgress: (step, detail, status) => {
            console.log(`[BullMQ Worker] [${step}] ${detail} (${status})`);
          }
        });
        console.log(`[BullMQ Worker] ✅ Successfully finished job ${job.id} for post ${postId}`);
      } catch (err) {
        console.error(`[BullMQ Worker] ❌ Job ${job.id} failed:`, err.message);
        throw err;
      }
    }, connectionOptions);

    queueWorker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed successfully.`);
    });

    queueWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job.id} failed with error:`, err);
    });

    console.log('[Scheduler] 🚀 BullMQ Queue and Worker initialized successfully.');
  } catch (err) {
    console.error('[Scheduler] ⚠️ Failed to initialize BullMQ:', err.message);
  }
}

/**
 * Add a post publishing job to the queue.
 */
async function schedulePublishJob(post) {
  if (publishQueue) {
    const delay = Math.max(0, new Date(post.scheduled_at).getTime() - Date.now());
    console.log(`[Scheduler] 📅 Queuing BullMQ job for post ${post.id} with delay of ${delay}ms (Scheduled for: ${post.scheduled_at})`);
    
    await publishQueue.add(
      `publish-${post.id}`, 
      { postId: post.id, userId: post.user_id },
      { delay, removeOnComplete: true, removeOnFail: false }
    );
  }
}

/**
 * Scans the database (or mock database) for scheduled posts that are due/overdue for publishing.
 */
async function scanAndPublishDuePosts() {
  const nowStr = new Date().toISOString();
  console.log(`[Scheduler Poller] 🔍 Scanning for posts scheduled before ${nowStr}...`);

  try {
    let duePosts = [];

    if (!supabase) {
      duePosts = global.mockPosts.filter(p => p.status === 'scheduled' && p.scheduled_at && new Date(p.scheduled_at) <= new Date());
    } else {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', nowStr);

      if (error) throw error;
      duePosts = data || [];
    }

    if (duePosts.length === 0) {
      return;
    }

    console.log(`[Scheduler Poller] 🔔 Found ${duePosts.length} due posts. Starting execution...`);

    for (const post of duePosts) {
      // Mark as publishing immediately to prevent double execution if multiple pollers run
      if (!supabase) {
        post.status = 'publishing';
      } else {
        await supabase
          .from('posts')
          .update({ status: 'publishing' })
          .eq('id', post.id);
      }

      console.log(`[Scheduler Poller] 🚀 Publishing post ${post.id} to ${post.platform}...`);
      
      // If BullMQ is active, delegate it to the queue for clean logging and retries
      if (publishQueue) {
        await schedulePublishJob(post);
        // Reset status to scheduled so BullMQ worker can grab it and process it
        if (!supabase) {
          post.status = 'scheduled';
        } else {
          await supabase
            .from('posts')
            .update({ status: 'scheduled' })
            .eq('id', post.id);
        }
      } else {
        // Direct execution fallback
        try {
          await publishPost({
            postId: post.id,
            userId: post.user_id
          });
          console.log(`[Scheduler Poller] ✅ Successfully published post ${post.id}`);
        } catch (err) {
          console.error(`[Scheduler Poller] ❌ Failed to publish post ${post.id}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler Poller] Error scanning due posts:', err.message);
  }
}

/**
 * Starts the scheduling worker.
 */
function startScheduler() {
  // Initialize BullMQ/Redis connections
  initBullMQ();

  // Start periodic check loop every 30 seconds
  console.log('[Scheduler] ⏰ Starting periodic database scheduler poller (interval: 30s)...');
  pollInterval = setInterval(scanAndPublishDuePosts, 30000);

  // Run once immediately on server startup to handle any missed posts during downtime
  scanAndPublishDuePosts();
}

/**
 * Clean shutdown of queue connections and timers.
 */
async function stopScheduler() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  if (queueWorker) {
    await queueWorker.close();
  }
  if (publishQueue) {
    await publishQueue.close();
  }
  console.log('[Scheduler] 🛑 Scheduler stopped.');
}

module.exports = {
  startScheduler,
  stopScheduler,
  schedulePublishJob
};
