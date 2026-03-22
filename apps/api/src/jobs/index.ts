import cron from 'node-cron';
import { runExpiryCheckJob } from './expiryCheck.js';
import { runLowStockCheckJob } from './lowStockCheck.js';
import { runMonthlySavingsJob } from './monthlySavings.js';

/**
 * Initialize all background jobs
 */
export function initializeJobs() {
    console.log('📅 Scheduling background jobs...');

    // Daily expiry check - runs at 6:00 AM IST every day
    cron.schedule('0 6 * * *', async () => {
        console.log('🔔 Running daily expiry check job...');
        try {
            await runExpiryCheckJob();
            console.log('✅ Expiry check job completed');
        } catch (error) {
            console.error('❌ Expiry check job failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });

    // Low stock check - runs every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        console.log('🔔 Running low stock check job...');
        try {
            await runLowStockCheckJob();
            console.log('✅ Low stock check job completed');
        } catch (error) {
            console.error('❌ Low stock check job failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });

    // Monthly savings aggregation - runs on 1st of every month at midnight
    cron.schedule('0 0 1 * *', async () => {
        console.log('🔔 Running monthly savings aggregation job...');
        try {
            await runMonthlySavingsJob();
            console.log('✅ Monthly savings job completed');
        } catch (error) {
            console.error('❌ Monthly savings job failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });

    console.log('✅ Background jobs scheduled:');
    console.log('   - Daily expiry check: 6:00 AM IST');
    console.log('   - Low stock check: Every 4 hours');
    console.log('   - Monthly savings: 1st of month at midnight');
}

// Export individual job runners for manual triggering (useful for testing)
export { runExpiryCheckJob } from './expiryCheck.js';
export { runLowStockCheckJob } from './lowStockCheck.js';
export { runMonthlySavingsJob } from './monthlySavings.js';
