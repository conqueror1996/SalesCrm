
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testSync() {
    const crmKey = process.env.INDIAMART_CRM_KEY;
    console.log(`Testing with key: ${crmKey}`);

    if (!crmKey) {
        console.log("No key found");
        return;
    }

    const endTime = new Date();
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 168); // Last 7 days

    const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = date.toLocaleString('en-US', { month: 'short' });
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    const url = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${crmKey}&start_time=${formatDate(startTime)}&end_time=${formatDate(endTime)}`;
    console.log(`URL: ${url}`);

    try {
        const response = await axios.get(url);
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

testSync();
