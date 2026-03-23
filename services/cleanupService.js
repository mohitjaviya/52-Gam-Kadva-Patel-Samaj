const { supabase } = require('../database/init');

// Run cleanup every 24 hours (86400000 ms)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

function startCleanupJob() {
    console.log('🧹 Started message cleanup service (runs daily)');
    
    // Run immediately on startup
    cleanupOldMessages();
    
    // Then schedule it to run daily
    setInterval(cleanupOldMessages, CLEANUP_INTERVAL);
}

async function cleanupOldMessages() {
    try {
        console.log('🗑️ Running routine cleanup of old messages...');
        
        // Calculate the date 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const cutoffDate = threeMonthsAgo.toISOString();

        // Delete messages older than 3 months
        const { error, count } = await supabase
            .from('messages')
            .delete({ count: 'exact' })
            .lt('created_at', cutoffDate);

        if (error) {
            console.error('❌ Failed to clean up old messages:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`✅ Cleanup complete. Deleted ${count || 0} messages older than 3 months.`);
        return { success: true, deletedCount: count || 0 };
    } catch (error) {
        console.error('❌ Unexpected error during msg cleanup:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { startCleanupJob, cleanupOldMessages };
