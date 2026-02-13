import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import axios from 'axios';

export async function GET() {
    try {
        const crmKey = process.env.INDIAMART_CRM_KEY;

        if (!crmKey) {
            return NextResponse.json({
                success: false,
                message: "IndiaMART CRM Key is missing in .env configuration."
            }, { status: 400 });
        }

        // FETCH REAL DATA with Date Range (Last 72 Hours)
        const endTime = new Date();
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - 72); // Increased sync window to 72 hours

        const formatDate = (date: Date) => {
            const d = date.getDate().toString().padStart(2, '0');
            const m = date.toLocaleString('en-US', { month: 'short' });
            const y = date.getFullYear();
            return `${d}-${m}-${y}`;
        };

        // TRY ENDPOINT 1 (mapi.indiamart.com/wservce/crm/crmListing/v2/ - VERIFIED WORKING)
        const url1 = `https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=${crmKey}&start_time=${formatDate(startTime)}&end_time=${formatDate(endTime)}`;

        let response;
        try {
            response = await axios.get(url1);
            if (response.data && response.data.RESPONSE) {
                const leads = response.data.RESPONSE;
                if (Array.isArray(leads) && leads.length > 0) {
                    await processLeads(leads);
                    return NextResponse.json({ success: true, count: leads.length, endpoint: 'mapi v2' });
                } else if (response.data.CODE === 204 || leads.length === 0) {
                    // Success but no leads
                    return NextResponse.json({ success: true, count: 0, message: "No new leads found in the last 72 hours." });
                }
            }
        } catch (e) {
            console.log("Endpoint 1 (mapi v2) failed, trying fallback...");
        }

        // TRY ENDPOINT 2 (m.indiamart.com - alternative)
        const url2 = `https://m.indiamart.com/services/mobile/leadmanager/allleads/?glusr_crm_key=${crmKey}&start_time=${formatDate(startTime)}&end_time=${formatDate(endTime)}`;
        try {
            response = await axios.get(url2);
            if (response.data && response.data.RESPONSE) {
                const leads = response.data.RESPONSE;
                if (Array.isArray(leads) && leads.length > 0) {
                    await processLeads(leads);
                    return NextResponse.json({ success: true, count: leads.length, endpoint: 'm.indiamart' });
                }
            }
        } catch (e) {
            console.log("Endpoint 2 (m.indiamart) failed.");
        }

        // IF BOTH FAIL OR RETURN NO DATA
        const status = response?.data?.STATUS || "UNKNOWN";
        const msg = response?.data?.MESSAGE || "No leads found in the selected range (Last 48 Hours)";

        return NextResponse.json({
            success: false,
            message: msg,
            details: `IndiaMART Status: ${status}. Note: Pull API keys expire in 7 days and must be generated from IndiaMART Seller Panel.`
        });

    } catch (error: any) {
        console.error("IndiaMART API Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function processLeads(leads: any[]) {
    for (const item of leads) {
        const phone = item.SENDER_MOBILE || item.SENDER_MOBILE_ALT;
        const name = item.SENDER_NAME || "IndiaMART Lead";
        const email = item.SENDER_EMAIL;
        const product = item.QUERY_PRODUCT_NAME;
        const message = item.QUERY_MESSAGE;
        const city = item.QUERY_CITY;

        // Check if lead already exists by phone
        let lead;
        if (phone) {
            lead = await prisma.lead.findFirst({
                where: { phone: { contains: phone.slice(-10) } }
            });
        }

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    name,
                    phone,
                    email,
                    product,
                    city,
                    message,
                    source: 'IndiaMART API',
                    status: 'new',
                    receivedAt: new Date(item.GENERATED_DATE || Date.now())
                }
            });
        }

        // Always add the requirement as a message if it's new
        const existingMessages = await prisma.message.findFirst({
            where: {
                leadId: lead.id,
                content: message
            }
        });

        if (!existingMessages && message) {
            await prisma.message.create({
                data: {
                    leadId: lead.id,
                    content: message,
                    sender: 'client',
                    timestamp: new Date(item.GENERATED_DATE || Date.now())
                }
            });
        }
    }
}
