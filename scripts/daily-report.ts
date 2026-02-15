import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import 'dotenv/config';

// Relative imports for scripts
import { analyzeContext } from '../src/lib/intelligence';

const prisma = new PrismaClient();

const BOSS_PHONE = process.env.BOSS_PHONE || '+918652475772';
const WHATSAPP_SERVER = process.env.NEXT_PUBLIC_WHATSAPP_SERVER_URL || 'http://localhost:3002';
const API_SECRET = process.env.API_SECRET || 'urbancrm_secret_key_123';

async function generateDailyReport() {
    console.log('📊 Generating Daily Sales Report...');

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch Today's Leads
        const leads = await prisma.lead.findMany({
            where: {
                receivedAt: {
                    gte: today
                }
            },
            include: {
                Message: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });

        // 2. Fetch All active leads to see pipeline movements
        const allLeads = await prisma.lead.findMany({
            include: {
                Message: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });

        let hotLeadsCount = 0;
        let totalPipelineValue = 0;
        let newLeadsCount = leads.length;
        let summaryLines: string[] = [];

        // 3. Analyze each lead
        for (const lead of allLeads) {
            const lastMsg = lead.Message[0] || { content: '', timestamp: new Date() };
            // @ts-ignore - formatting message for analyzer
            const guidance = analyzeContext(lead as any, lastMsg as any);

            if (guidance.leadScore === 'HOT 🔥') {
                hotLeadsCount++;
            }
            totalPipelineValue += (guidance.numericValue || 0);

            // If it's a new lead from today, add to summary
            if (new Date(lead.receivedAt) >= today) {
                summaryLines.push(`• ${lead.name} (${guidance.leadScore}) - ${guidance.estimatedValue}`);
            }
        }

        // 4. Format Message
        const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const reportMessage = `📝 *DAILY SALES INTELLIGENCE REPORT*
_Date: ${dateStr}_

📈 *OVERVIEW*
- Total New Leads: *${newLeadsCount}*
- Hot Leads Active: *${hotLeadsCount}*
- Est. Pipeline Value: *₹${(totalPipelineValue / 100000).toFixed(2)} Lakhs*

🆕 *NEW LEADS TODAY*
${summaryLines.length > 0 ? summaryLines.join('\n') : '_No new leads today._'}

🤖 *AGENT OBSERVATION*
"Today's conversion focus should be on the ${hotLeadsCount} hot leads. I have already initiated value-defense for the pricing inquiries detected."

✅ *Action Required:* Please review the 'Hot Leads' in the CRM dashboard.`;

        // 5. Send via WhatsApp Server
        console.log('📤 Sending report to Boss...');
        const response = await axios.post(`${WHATSAPP_SERVER}/send`, {
            to: BOSS_PHONE,
            message: reportMessage
        }, {
            headers: {
                'x-api-secret': API_SECRET
            }
        });

        if (response.data.success) {
            console.log('✅ Daily Report Sent Successfully!');
        } else {
            console.error('❌ Failed to send report:', response.data);
        }

    } catch (error) {
        console.error('❌ Error generating report:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the generator
generateDailyReport();
