import cron from "node-cron";
import { updateExchangeRates } from "../services/exchangeRate.service";

/**
 * Schedule exchange rate updates
 * Runs daily at 2:00 AM (configurable via env)
 */
export function startExchangeRateScheduler(): void {
    // Get schedule from env or default to 2:00 AM daily
    const schedule = process.env.EXCHANGE_RATE_UPDATE_SCHEDULE || "0 2 * * *";
    const baseCurrency = process.env.EXCHANGE_RATE_BASE_CURRENCY || "USD";

    console.log(`[Exchange Rate Scheduler] Starting scheduler with schedule: ${schedule}`);
    console.log(`[Exchange Rate Scheduler] Base currency: ${baseCurrency}`);

    // Schedule daily update
    cron.schedule(schedule, async () => {
        console.log(`[Exchange Rate Scheduler] Running scheduled update at ${new Date().toISOString()}`);
        
        try {
            const result = await updateExchangeRates(baseCurrency);
            
            if (result.success) {
                console.log(`[Exchange Rate Scheduler] Update completed: ${result.message}`);
            } else {
                console.error(`[Exchange Rate Scheduler] Update failed: ${result.message}`);
            }
        } catch (error: any) {
            console.error(`[Exchange Rate Scheduler] Error during scheduled update:`, error.message);
        }
    }, {
        timezone: process.env.TZ || "UTC",
    });

    console.log(`[Exchange Rate Scheduler] Scheduler started successfully`);
}

/**
 * Manually trigger exchange rate update (for testing or manual updates)
 */
export async function triggerManualUpdate(): Promise<void> {
    const baseCurrency = process.env.EXCHANGE_RATE_BASE_CURRENCY || "USD";
    
    console.log(`[Exchange Rate Scheduler] Manual update triggered`);
    
    try {
        const result = await updateExchangeRates(baseCurrency);
        
        if (result.success) {
            console.log(`[Exchange Rate Scheduler] Manual update completed: ${result.message}`);
        } else {
            console.error(`[Exchange Rate Scheduler] Manual update failed: ${result.message}`);
        }
    } catch (error: any) {
        console.error(`[Exchange Rate Scheduler] Error during manual update:`, error.message);
        throw error;
    }
}

