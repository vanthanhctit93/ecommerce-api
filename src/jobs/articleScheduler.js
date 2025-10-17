import cron from 'node-cron';
import Article from '../models/Article.js';

// Run every minute
cron.schedule('* * * * *', async () => {
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
    }
});