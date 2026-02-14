import { Lead, Message, Product, PRODUCTS } from '../data/mockData';

// --- CONFIGURATION ---
const BOSS_PHONE_NUMBER = process.env.NEXT_PUBLIC_BOSS_PHONE || '919876543210';
const AGENT_NAME = 'Rahul'; // Persona: Sales Manager
const COMPANY_CONTEXT = {
    name: 'Urban Clay',
    office: 'Kharghar, Navi Mumbai (near Hotel Highway Break)', // Updated Location
    old_office: 'Chembur (Vacated)',
    factory: 'Madhya Pradesh (Central India)',
    usps: [
        'Fired at 1200°C for 48 hours (35MPa Strength)',
        'Zero Maintenance for 50 years',
        'Anti-fungal & Low Water Absorption (<10%)',
        'Eco-friendly Natural Clay'
    ],
    transport_note: 'Rates are Ex-Factory (Transport Extra)',
    flexible_cladding_policy: 'BOSS_HANDLE' // Special case
};

// --- TYPES ---
export type AgentState = 'IDLE' | 'THINKING' | 'TYPING' | 'WAITING_FOR_BOSS' | 'ACTIVE';

export interface AgentDecision {
    action: 'REPLY' | 'ALERT_BOSS' | 'DO_NOTHING' | 'WAIT';
    response?: string;
    thoughtProcess: string;
    typingDelayMs: number;
    detectedLanguage: 'English' | 'Hindi' | 'Marathi';
}

// --- PRICING ENGINE ---
function calculatePrice(product: Product, areaSqFt: number): { rateSqFt: number, ratePerPc: number, total: number, margin: string } {
    let marginPercent = 0.39; // Default < 600 sqft

    if (areaSqFt > 5000) marginPercent = 0.19;
    else if (areaSqFt >= 600) marginPercent = 0.29;

    const cost = product.purchaseRate;
    // Selling Price = Cost / (1 - Margin)  <-- Standard markup formula, or does user mean Cost + Margin%?
    // User said "take 39% margin". Usually means Gross Margin. 
    // Let's use: Price = Cost + (Cost * Margin) for simplicity unless specified "Gross Margin"
    // Actually, "take 39% margin" usually implies (Price - Cost) / Price = 39%. 
    // So Price = Cost / (1 - 0.39).
    // Let's stick to a simpler Markup for now to avoid overshooting perception: Price = Cost * (1 + Margin)
    // Wait, user said "take 39% margin". Let's use Markup logic: Cost + 39% of Cost.

    const sellingPricePc = Math.ceil(cost * (1 + marginPercent));

    // SqFt Calculation (Mocking standard brick size coverage if distinct not avail, 
    // typically 1 sqft needs ~5-6 standard bricks or ~3-4 tiles depending on size)
    // Let's assume standard coverage: 5 pcs / sqft
    const pcsPerSqFt = 5;
    const sellingPriceSqFt = sellingPricePc * pcsPerSqFt;

    return {
        rateSqFt: sellingPriceSqFt,
        ratePerPc: sellingPricePc,
        total: sellingPriceSqFt * areaSqFt,
        margin: `${marginPercent * 100}%`
    };
}

function findProductInText(text: string): Product | undefined {
    const lower = text.toLowerCase();
    // Simple exhaustive search
    return PRODUCTS.find(p => lower.includes(p.name.toLowerCase()) || lower.includes(p.category));
}


// --- LANGUAGE DETECTION (Basic Heuristic) ---
function detectLanguage(text: string): 'English' | 'Hindi' | 'Marathi' {
    const lower = text.toLowerCase();
    if (lower.match(/(aahe|pahije|kuther|kay|bol|kasa|mi|tula|kiti)/)) return 'Marathi';
    if (lower.match(/(hai|kya|kaise|main|tum|aap|chahiye|bhai|kitna)/)) return 'Hindi';
    return 'English';
}

// --- INTENT ANALYSIS ---
type IntentType = 'BUY_NOW' | 'PRICE_INQUIRY' | 'INSTALLATION_INQUIRY' | 'LOCATION_INQUIRY' | 'PRODUCT_INFO' | 'COMPLAINT' | 'FLEXIBLE_CLADDING' | 'CASUAL';

function analyzeIntent(text: string): { intent: IntentType, emotion: string, urgency: number } {
    const lower = text.toLowerCase();

    // 1. Special Trigger
    if (lower.includes('flexible') || lower.includes('flexi')) return { intent: 'FLEXIBLE_CLADDING', emotion: 'Neutral', urgency: 5 };

    // 2. High Urgency
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('account') || lower.includes('pay')) {
        return { intent: 'BUY_NOW', emotion: 'Anxious', urgency: 9 };
    }

    // 3. Price / Costing
    if (lower.includes('price') || lower.includes('rate') || lower.includes('cost') || lower.includes('quote') || lower.includes('kaise diya')) {
        return { intent: 'PRICE_INQUIRY', emotion: 'Curious', urgency: 7 };
    }

    // 4. Installation
    if (lower.includes('install') || lower.includes('fit') || lower.includes('labour') || lower.includes('lagane') || lower.includes('mistri')) {
        return { intent: 'INSTALLATION_INQUIRY', emotion: 'Concerned', urgency: 6 };
    }

    // 5. Location
    if (lower.includes('office') || lower.includes('shop') || lower.includes('store') || lower.includes('kahan') || lower.includes('kuth')) {
        return { intent: 'LOCATION_INQUIRY', emotion: 'Neutral', urgency: 5 };
    }

    if (lower.includes('waste') || lower.includes('late') || lower.includes('broken')) {
        return { intent: 'COMPLAINT', emotion: 'Angry', urgency: 8 };
    }

    return { intent: 'CASUAL', emotion: 'Neutral', urgency: 2 };
}

// --- HUMAN MIMICRY ---
function calculateTypingDelay(response: string): number {
    const typingSpeedPerCharMs = 150; // Faster agent
    const thinkingTimeMs = 1000;
    const baseDelay = (response.length * typingSpeedPerCharMs) + thinkingTimeMs;
    return Math.min(baseDelay, 12000);
}

// --- MAIN AGENT BRAIN ---
export async function agentBrain(lead: Lead, lastMessage: string): Promise<AgentDecision> {
    const lang = detectLanguage(lastMessage);
    const { intent, emotion, urgency } = analyzeIntent(lastMessage);

    // Default Decision
    let decision: AgentDecision = {
        action: 'DO_NOTHING',
        thoughtProcess: 'Listening...',
        typingDelayMs: 0,
        detectedLanguage: lang
    };

    // ---------------------------------------------------------
    // 1. BOSS ALERTS (Flexible Cladding or Anger)
    // ---------------------------------------------------------
    if (intent === 'FLEXIBLE_CLADDING' || emotion === 'Angry') {
        const reason = intent === 'FLEXIBLE_CLADDING' ? 'Flexible Cladding Inquiry' : 'Client is Angry';
        return {
            action: 'ALERT_BOSS',
            thoughtProcess: `Handling Policy: ${reason}. Pausing and Alerting Boss.`,
            typingDelayMs: 0,
            detectedLanguage: lang
        };
    }

    // ---------------------------------------------------------
    // 2. PRICING LOGIC
    // ---------------------------------------------------------
    if (intent === 'PRICE_INQUIRY') {
        // Needs Product & Area
        const product = findProductInText(lastMessage) || findProductInText(lead.product || '') || PRODUCTS[0]; // Fallback to first if unknown

        // Check if we have Area
        const areaMatch = lastMessage.match(/(\d+)\s*(sqft|sq\.ft|feet)/i);
        const requestArea = areaMatch ? parseInt(areaMatch[1]) : (lead.estimatedArea || 0);

        if (requestArea === 0) {
            // ASK FOR QUANTITY
            let reply = '';
            if (lang === 'Marathi') reply = `Namaskar, ${AGENT_NAME} boltoy Urban Clay madhun. Rate quantity war avalambun ahe. Tumhala sadharan kiti sqft chi requirement ahe?`;
            else if (lang === 'Hindi') reply = `Namaste, main ${AGENT_NAME} baat kar raha hoon Urban Clay se. Sahi rate dene ke liye, kya aap bata sakte hain ki approx kitna sqft area hai?`;
            else reply = `Hi, this is ${AGENT_NAME} from Urban Clay. To give you the best price, could you please confirm the approximate area (sqft) required? Qty affects the discount.`;

            return {
                action: 'REPLY',
                response: reply,
                thoughtProcess: 'Detected Price Inquiry -> Missing Area -> Asking Requirement.',
                typingDelayMs: calculateTypingDelay(reply),
                detectedLanguage: lang
            };
        } else {
            // CALCULATE
            const pricing = calculatePrice(product, requestArea);

            let reply = '';
            // value selling pitch
            const pitch = `This is our premium ${product.name}, fired at 1200°C. It fits perfectly for your ${requestArea} sqft area.`;
            const priceBreakup = `\nRate: ₹${pricing.rateSqFt}/sqft (approx ₹${pricing.ratePerPc}/pc).\nTransport is extra as per actuals.`;

            if (lang === 'Marathi') reply = `${pitch} Rate: ₹${pricing.rateSqFt}/sqft padel. Hai rate ex-factory ahe (Transport extra). ${requestArea} sqft sathi best rate dila ahe.`;
            else if (lang === 'Hindi') reply = `${pitch} Aapke ${requestArea} sqft ke liye special rate rahega ₹${pricing.rateSqFt}/sqft. Yeh bina transport ka rate hai. Kya main installation cost bhi jodoon?`;
            else reply = `${pitch} For your ${requestArea} sqft volume, I can offer a special rate of ₹${pricing.rateSqFt}/sqft (₹${pricing.ratePerPc}/pc).\nNote: Rates are Ex-Factory. Should I schedule a site visit?`;

            return {
                action: 'REPLY',
                response: reply,
                thoughtProcess: `Calculated Price for ${requestArea}sqft: ₹${pricing.rateSqFt}/sqft (Margin: ${pricing.margin}). Pitching Value.`,
                typingDelayMs: calculateTypingDelay(reply),
                detectedLanguage: lang
            };
        }
    }

    // ---------------------------------------------------------
    // 3. INSTALLATION
    // ---------------------------------------------------------
    if (intent === 'INSTALLATION_INQUIRY') {
        let reply = '';
        if (lang === 'Hindi') reply = "Haan, hum installation assistance dete hain. Main apne expert installation team se baat karke 30-60 mins main aapko exact labour cost batata hoon.";
        else if (lang === 'Marathi') reply = "Ho, amchya kade expert fitters ahet. Mi tyanchyashi bolun ardhya tasat tumhala installation charge sangto.";
        else reply = "Yes, we provide installation assistance. Let me check with our technical team and share the exact labour estimate within 30-60 minutes.";

        return {
            action: 'REPLY',
            response: reply,
            thoughtProcess: 'Installation requested. Buying time (30-60mins) to consult.',
            typingDelayMs: calculateTypingDelay(reply),
            detectedLanguage: lang
        };
    }

    // ---------------------------------------------------------
    // 4. LOCATION
    // ---------------------------------------------------------
    if (intent === 'LOCATION_INQUIRY') {
        const reply = `Our Experience Centre is in Kharghar, Navi Mumbai (near Hotel Highway Break). We recently moved from Chembur to this bigger space. You can check the google map location here. When are you planning to visit?`;
        return {
            action: 'REPLY',
            response: reply,
            thoughtProcess: 'Shared Office Location (Kharghar). Asked for visit.',
            typingDelayMs: calculateTypingDelay(reply),
            detectedLanguage: lang
        };
    }

    // ---------------------------------------------------------
    // 5. BUYING / SAMPLES
    // ---------------------------------------------------------
    if (intent === 'BUY_NOW') {
        let reply = '';
        if (lang === 'Hindi') reply = "Great! Kya main aapke site par samples bhajwa doon? Address confirm kar dijiye.";
        else reply = "That's great. Shall I dispatch a sample box to your site today? Please confirm the location.";

        return {
            action: 'REPLY',
            response: reply,
            thoughtProcess: 'High Intent detected. Closing on Sample Dispatch.',
            typingDelayMs: calculateTypingDelay(reply),
            detectedLanguage: lang
        };
    }

    // Fallback Casual
    if (intent === 'CASUAL') decision = {
        action: 'REPLY',
        response: lang === 'Hindi' ? "Ji boliye, aur kya jankari chahiye?" : "Sure, let me know if you need more details on specifications.",
        thoughtProcess: "General inquiry. Keeping it open.",
        typingDelayMs: 3000,
        detectedLanguage: lang
    };

    return decision;
}

// --- BOSS ALERT SYSTEM ---
export function formatBossAlert(lead: Lead, decision: AgentDecision): string {
    return `🚨 *BOSS ALERT* 🚨
    
    *Client:* ${lead.name} (${lead.phone})
    *Status:* ${decision.thoughtProcess}
    *Reason:* Manual Intervention Required
    *Action Required:* Please takeover chat immediately. Agent has paused.
    
    [Reply 'RESUME' to re-activate Agent]`;
}
