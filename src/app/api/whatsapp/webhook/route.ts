import { NextResponse } from "next/server";

// 1. Webhook Verification (GET)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Check if mode and token match
    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
}

// 2. Incoming Messages (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check if this is a WhatsApp status update or message
        if (body.object === "whatsapp_business_account") {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;

            if (messages && messages.length > 0) {
                const message = messages[0];
                const from = message.from; // Sender's phone number
                const messageBody = message.text?.body; // Message content

                console.log(`📩 New Message from ${from}: ${messageBody}`);

                // TODO: Process the lead later
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Webhook Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
