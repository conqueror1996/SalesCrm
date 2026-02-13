import axios from "axios";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const WHATSAPP_SERVER_URL = process.env.NEXT_PUBLIC_WHATSAPP_SERVER_URL || 'http://localhost:3002';

export async function POST(req: Request) {
    try {
        const { to, message } = await req.json();

        // OPTION 2: Try Local WhatsApp Server first (Best for keeping mobile app)
        try {
            await axios.post(`${WHATSAPP_SERVER_URL}/send`, { to, message });
            return NextResponse.json({ success: true, method: 'local' });
        } catch (localError) {
            console.log("Local WhatsApp server not running, falling back to Meta Cloud API...");
        }

        // OPTION 1: Fallback to Meta Cloud API
        const cleanTo = to.replace(/\D/g, '');
        const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const response = await axios.post(
            url,
            {
                messaging_product: "whatsapp",
                to: cleanTo,
                type: "text",
                text: { body: message },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // SAVE TO DATABASE ON FALLBACK SUCCESS
        if (response.data) {
            const lead = await prisma.lead.findFirst({
                where: { phone: { contains: cleanTo.slice(-10) } }
            });

            if (lead) {
                await prisma.message.create({
                    data: {
                        leadId: lead.id,
                        content: message,
                        sender: 'salesrep',
                        timestamp: new Date()
                    }
                });

                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'follow_up', updatedAt: new Date() }
                });
            }
        }

        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error("WhatsApp API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: error.response?.data || error.message }, { status: 500 });
    }
}
