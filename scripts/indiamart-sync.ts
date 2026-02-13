
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function runSync() {
    console.log(`[${new Date().toLocaleString()}] 🔄 Starting Automatic IndiaMART Sync...`);

    try {
        const response = await axios.get(`${API_URL}/api/indiamart/sync`);
        if (response.data.success) {
            console.log(`[${new Date().toLocaleString()}] ✅ Sync Successful: Found ${response.data.count} updates.`);
        } else {
            console.log(`[${new Date().toLocaleString()}] ⚠️ Sync completed with message: ${response.data.message}`);
        }
    } catch (error: any) {
        console.error(`[${new Date().toLocaleString()}] ❌ Sync Error:`, error.message);
        console.log(`Note: Ensure the dev server is running at ${API_URL}`);
    }
}

console.log('🚀 IndiaMART Automatic Poller Started');
console.log(`Interval: Every 15 minutes`);

// Run immediately on start
runSync();

// Then schedule
setInterval(runSync, SYNC_INTERVAL);

// Keep script alive
process.stdin.resume();
