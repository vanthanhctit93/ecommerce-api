import cron from 'node-cron';
import Article from '../models/Article.js';

let schedulerTask = null;
let isRunning = false;

/**
 * Start article auto-publish scheduler
 */
export function startArticleScheduler() {
    if (schedulerTask) {
        console.log('⚠️  Article scheduler already running');
        return;
    }

    // Run every minute
    schedulerTask = cron.schedule('* * * * *', async () => {
        // Prevent overlapping executions
        if (isRunning) {
            console.log('⏭️  Skipping scheduler run (previous run still in progress)');
            return;
        }

        isRunning = true;

        try {
            const now = new Date();
            
            const result = await Article.updateMany(
                {
                    status: 'draft',
                    scheduledAt: { $lte: now, $ne: null },
                    isDeleted: false
                },
                {
                    $set: {
                        status: 'published',
                        publishedAt: now,
                        scheduledAt: null
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ Auto-published ${result.modifiedCount} scheduled articles`);
            }
        } catch (error) {
            console.error('❌ Auto-publish cron error:', error);
        } finally {
            isRunning = false;
        }
    });

    console.log('✅ Article scheduler started');
}

/**
 * Stop article auto-publish scheduler
 */
export function stopArticleScheduler() {
    if (schedulerTask) {
        schedulerTask.stop();
        schedulerTask = null;
        isRunning = false;
        console.log('🛑 Article scheduler stopped');
    }
}