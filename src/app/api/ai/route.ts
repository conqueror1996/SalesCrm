import { NextResponse } from 'next/server';
import { analyzeLeadWithAI, generateAgentResponse, generateSmartReplyWithAI } from '@/lib/ai-service';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, lead, lastMessage, messageContent, customerType } = body;

        if (!action) {
            return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'analyze_lead':
                if (!lead || !lastMessage) {
                    return NextResponse.json({ error: 'Missing lead or lastMessage' }, { status: 400 });
                }
                result = await analyzeLeadWithAI(lead, lastMessage);
                break;

            case 'generate_agent_response':
                if (!lead || !lastMessage) {
                    return NextResponse.json({ error: 'Missing lead or lastMessage' }, { status: 400 });
                }
                result = await generateAgentResponse(lead, lastMessage.content || lastMessage);
                break;

            case 'generate_smart_reply':
                if (!messageContent) {
                    return NextResponse.json({ error: 'Missing messageContent' }, { status: 400 });
                }
                result = await generateSmartReplyWithAI(messageContent, customerType || 'Unknown', lead);
                break;

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('AI API Error:', error);
        return NextResponse.json(
            { error: `AI service error: ${error.message}` },
            { status: 500 }
        );
    }
}
