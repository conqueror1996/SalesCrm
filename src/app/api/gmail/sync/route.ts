import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session: any = await getServerSession();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: session.accessToken });

        const gmail = google.gmail({ version: "v1", auth });

        // Search for IndiaMART leads in the last 24 hours
        const res = await gmail.users.messages.list({
            userId: "me",
            q: "from:indiamart.com after:" + Math.floor(Date.now() / 1000 - 86400),
        });

        const messages = res.data.messages || [];
        const savedLeads = [];
        for (const msg of messages) {
            const details = await gmail.users.messages.get({
                userId: "me",
                id: msg.id!,
            });

            const snippet = details.data.snippet || "";
            // Simplified parsing: assume title/phone is in the snippet or subject
            // For IndiaMART, the snippet usually contains the lead's name and phone.
            const nameMatch = snippet.match(/Name:\s*([^,]+)/);
            const phoneMatch = snippet.match(/Mobile:\s*([^+]+)/);

            const name = nameMatch ? nameMatch[1].trim() : "IndiaMART Lead";
            const phone = phoneMatch ? phoneMatch[1].trim().replace(/\s+/g, '') : undefined;

            // Check if lead already exists
            let lead;
            if (phone) {
                lead = await prisma.lead.findUnique({ where: { phone } });
            }

            if (!lead) {
                lead = await prisma.lead.create({
                    data: {
                        name,
                        phone,
                        source: 'IndiaMART',
                        status: 'new',
                        message: snippet,
                        receivedAt: new Date(parseInt(details.data.internalDate!) || Date.now()),
                        messages: {
                            create: {
                                content: snippet,
                                sender: 'client',
                                timestamp: new Date(parseInt(details.data.internalDate!) || Date.now()),
                            }
                        }
                    }
                });
                savedLeads.push(lead);
            }
        }

        return NextResponse.json({ success: true, leads: savedLeads });
    } catch (error: any) {
        console.error("Gmail API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
