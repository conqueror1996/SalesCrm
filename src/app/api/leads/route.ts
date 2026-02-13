import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: {
                receivedAt: 'desc',
            },
            take: 50,
            include: {
                messages: {
                    orderBy: {
                        timestamp: 'asc',
                    },
                },
            },
        });
        console.log(`API: Fetched ${leads.length} leads`);
        return NextResponse.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields (basic check)
        if (!body.name && !body.phone && !body.email) {
            return NextResponse.json({ error: 'Missing lead contact info' }, { status: 400 });
        }

        let lead;

        // If phone is provided, try to find existing lead to update
        if (body.phone) {
            const existingLead = await prisma.lead.findFirst({
                where: { phone: body.phone }
            });

            if (existingLead) {
                // Update existing lead with new message if provided
                lead = await prisma.lead.update({
                    where: { id: existingLead.id },
                    data: {
                        // Update basic info if provided (optional, maybe we want to keep original source?)
                        // For now, let's just update the timestamp and status
                        updatedAt: new Date(),
                        status: 'new', // Re-open or mark as new activity
                        // If there is a new message body, we should create a Message record for it?
                        // The frontend logic for manual add also sends a WhatsApp message immediately.
                        // We can store the 'message' field on Lead as the "latest inquiry" or just rely on Message table.
                        message: body.message || existingLead.message
                    }
                });
            }
        }

        // If no lead found or no phone provided (falling back to creating new)
        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    name: body.name || 'Unknown',
                    phone: body.phone,
                    email: body.email,
                    product: body.product,
                    quantity: body.quantity,
                    city: body.city,
                    message: body.message,
                    source: body.source || 'IndiaMART',
                    receivedAt: body.received_at ? new Date(body.received_at) : new Date(),
                    status: 'new',
                },
            });
        }

        // If the manual entry included a message, we should also save it to the Message history
        if (body.message) {
            await prisma.message.create({
                data: {
                    leadId: lead.id,
                    content: body.message,
                    sender: 'client', // Treated as 'client' intent (or could be 'system') - usually manual entry represents client inquiry
                    timestamp: new Date()
                }
            });
        }

        return NextResponse.json(lead, { status: 201 });
    } catch (error: any) {
        console.error('Error creating/updating lead:', error);
        return NextResponse.json({ error: `Failed to save lead: ${error.message || error}` }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();

        if (!body.id || !body.status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
        }

        const updatedLead = await prisma.lead.update({
            where: { id: body.id },
            data: { status: body.status }
        });

        return NextResponse.json(updatedLead);
    } catch (error: any) {
        console.error('Error updating status:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
