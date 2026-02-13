import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { leadId, content, sender, type } = body;

        if (!leadId || !content) {
            return NextResponse.json({ error: 'Missing leadId or content' }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                leadId,
                content,
                sender: sender || 'salesrep',
                timestamp: new Date(),
            }
        });

        // Also update the lead's updatedAt and status if it was 'NEW'
        await prisma.lead.update({
            where: { id: leadId },
            data: {
                updatedAt: new Date(),
                status: 'follow_up' // Move from NEW to follow_up after first reply
            }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error: any) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: `Failed to save message: ${error.message}` }, { status: 500 });
    }
}
