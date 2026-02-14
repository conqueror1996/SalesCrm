import fs from 'fs';
// @ts-ignore
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcodeTerminal from 'qrcode-terminal';
// @ts-ignore
import QRCode from 'qrcode'; // Add QRCode library
import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';

const prisma = new PrismaClient();
const app = express();

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://sales-crm-lemon-beta.vercel.app',
    process.env.FRONTEND_URL
].filter((o): o is string => !!o);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Security Middleware: API Key Check
const API_SECRET = process.env.API_SECRET || 'urbancrm_secret_key_123'; // Default fallback for dev, override in prod!

const authenticate = (req: any, res: any, next: any) => {
    // Allow health check without auth for UptimeRobot
    if (req.path === '/health') return next();

    const apiKey = req.headers['x-api-secret'];
    if (!apiKey || apiKey !== API_SECRET) {
        console.warn(`Unauthorized access attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// Apply auth to all routes except health
app.use((req, res, next) => {
    if (req.path === '/health') return next();
    authenticate(req, res, next);
});

// State for API
let isConnected = false;
let qrCodeData = '';

console.log('🔄 Initializing WhatsApp Client...');

const isProduction = process.env.NODE_ENV === 'production';

let client: any;



const createClient = () => {
    const chromePath = '/usr/bin/google-chrome-stable';
    const hasChrome = isProduction && fs.existsSync(chromePath);

    if (isProduction && !hasChrome) {
        console.warn(`⚠️ Warning: Chrome not found at ${chromePath}, letting Puppeteer find it...`);
    }

    return new Client({
        authStrategy: new LocalAuth({
            clientId: 'sales-crm-session',
            dataPath: './.wwebjs_auth' // Use relative path for both dev and prod to avoid permission issues
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                // '--single-process', // Disabled for stability on restarts
                '--disable-gpu'
            ],
            ...(hasChrome ? { executablePath: chromePath } : {})
        }
    });
};

const setupEvents = (c: any) => {
    c.on('qr', async (qr: any) => {
        console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP MOBILE APP:');
        qrcodeTerminal.generate(qr, { small: true });

        // Generate QR Image Data URI for frontend
        try {
            qrCodeData = await QRCode.toDataURL(qr);
            isConnected = false;
        } catch (err) {
            console.error('Error generating QR code', err);
        }
    });

    c.on('ready', () => {
        console.log('✅ WhatsApp Client is Ready!');
        isConnected = true;
        qrCodeData = ''; // Clear QR code on success
    });

    c.on('disconnected', (reason: any) => {
        console.log('❌ WhatsApp Client Disconnected:', reason);
        isConnected = false;
    });

    c.on('message_create', async (msg: any) => {
        try {
            // Ignore status updates
            if (msg.from === 'status@broadcast') return;

            const contact = await msg.getContact();
            const chat = await msg.getChat();

            // Extract phone number (remove @c.us)
            const phoneNumber = contact.number;
            const name = contact.pushname || contact.name || 'Unknown';
            const isGroup = chat.isGroup;

            // Skip groups for now (optional)
            if (isGroup) return;

            console.log(`📩 New Message from ${name} (${phoneNumber}): ${msg.body}`);

            // Determine sender (client vs salesrep)
            const sender = msg.fromMe ? 'salesrep' : 'client';

            // 1. Find or Create Lead
            let lead = await prisma.lead.findUnique({
                where: { phone: phoneNumber } as any
            });

            if (!lead) {
                console.log(`🆕 New Lead Detected: ${name}`);
                lead = await prisma.lead.create({
                    data: {
                        phone: phoneNumber,
                        name: name || 'Unknown WhatsApp User', // Ensure name is not null
                        status: 'new',
                        source: 'WhatsApp'
                    }
                } as any);
            }

            // 2. Save Message
            await (prisma as any).message.create({
                data: {
                    leadId: lead.id,
                    content: msg.body,
                    sender: sender,
                    whatsappMessageId: msg.id.id,
                    timestamp: new Date(msg.timestamp * 1000)
                }
            });

            // 3. Update Lead timestamp
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    updatedAt: new Date(),
                    ...(sender === 'client' ? { status: 'follow_up' } : {})
                }
            });

        } catch (error) {
            console.error('❌ Error handling message:', error);
        }
    });
};

// Initialize First Client
client = createClient();
setupEvents(client);




// Health check endpoint for Render.com
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        whatsapp: {
            connected: isConnected,
            initializing: isInitializing,
            hasQR: qrCodeData.length > 0
        }
    });
});

// API to get status (Frontend polling)
app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        qr: qrCodeData,
        initializing: isInitializing
    });
});

let isInitializing = false;

app.post('/init', async (req, res) => {
    if (isConnected) return res.json({ message: 'Already connected' });
    if (isInitializing) return res.json({ message: 'Already initializing' });

    isInitializing = true;
    qrCodeData = '';

    try {
        console.log('🔄 Initializing WhatsApp Client request received...');
        await client.initialize();
        res.json({ success: true });
    } catch (error: any) {
        isInitializing = false;
        res.status(500).json({ error: error.message });
    }
});

app.post('/restart', async (req, res) => {
    try {
        console.log('🔄 Restarting WhatsApp Client to generate new QR...');

        // Destroy current client
        try {
            if (client) await client.destroy();
        } catch (e) {
            console.warn('⚠️ Warning: Client destroy() failed (ignoring):', e);
        }

        isConnected = false;
        isInitializing = true;
        qrCodeData = '';

        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Reinitialize FRESH client
        client = createClient();
        setupEvents(client);

        console.log('🔄 Initializing fresh client...');
        await client.initialize();

        res.json({ success: true, message: 'Client restarted, new QR code will be generated' });
    } catch (error: any) {
        isInitializing = false;
        console.error('Restart error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/stop', async (req, res) => {
    try {
        await client.destroy();
        isConnected = false;
        isInitializing = false;
        qrCodeData = '';
        console.log('🛑 WhatsApp Client stopped.');

        // Re-create client instance to be ready for next init? 
        // whatsapp-web.js client restart is tricky. Often easier to just destroy and process exit or just destroy.
        // For simple restart, destroy is enough usually, but we need to re-instantiate if we want to init again?
        // Actually, client.initialize() can be called again after destroy() on the same instance in some versions, 
        // but safest is to just kill the process in dev.
        // For now, let's just destroy.

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API to send messages from CRM
app.post('/send', async (req, res) => {
    const { to, message, mediaUrl, caption } = req.body;

    try {
        if (!to || (!message && !mediaUrl)) {
            res.status(400).json({ error: 'Missing to or message/mediaUrl' });
            return;
        }

        if (!isConnected) {
            res.status(503).json({ error: 'WhatsApp client is not connected' });
            return;
        }

        // Format number for WhatsApp (remove + and ensure @c.us)
        const number = to.replace(/\D/g, '') + '@c.us';

        let sentMsg;
        if (mediaUrl || (req.body.mediaData && req.body.mimetype)) {
            try {
                let media;
                if (mediaUrl) {
                    media = await MessageMedia.fromUrl(mediaUrl);
                } else if (req.body.mediaData) {
                    // Base64 handling
                    media = new MessageMedia(req.body.mimetype, req.body.mediaData, req.body.filename || 'file');
                }

                if (media) {
                    sentMsg = await client.sendMessage(number, media, { caption: caption || message });
                    console.log(`📤 Sent MEDIA to ${to}`);
                }
            } catch (err: any) {
                console.error('Error handling media:', err);
                sentMsg = await client.sendMessage(number, `[MEDIA FAIL] ${message} (Error sending media)`);
            }
        } else {
            sentMsg = await client.sendMessage(number, message);
            console.log(`📤 Sent message to ${to}: ${message}`);
        }

        // Save to DB as salesrep message
        // Find lead first
        const lead = await prisma.lead.findFirst({
            where: { phone: { contains: to.replace(/\D/g, '').slice(-10) } } // fuzzy match last 10 digits
        });

        if (lead) {
            await (prisma as any).message.create({
                data: {
                    leadId: lead.id,
                    content: mediaUrl ? `[MEDIA] ${caption || message || 'Image'}` : message,
                    sender: 'salesrep',
                    timestamp: new Date()
                }
            });

            await prisma.lead.update({
                where: { id: lead.id },
                data: { status: 'follow_up' }
            });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Send Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Removed auto-initialize
// client.initialize();

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`🚀 WhatsApp API Server running on port ${PORT}`);
});
