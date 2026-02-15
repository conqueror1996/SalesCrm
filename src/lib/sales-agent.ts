import { Lead, Message, Product, PRODUCTS } from '../data/mockData';

// --- CONFIGURATION ---
const BOSS_PHONE_NUMBER = process.env.NEXT_PUBLIC_BOSS_PHONE || '919876543210';
const AGENT_NAME = 'Rahul'; // Persona: Sales Manager
const COMPANY_CONTEXT = {
    name: 'Urban Clay',
    office: 'Kharghar, Navi Mumbai (near Hotel Highway Break)',
    old_office: 'Chembur (Vacated)',
    factory: 'Madhya Pradesh (Central India)',
    usps: [
        'Fired at 1200°C for superior strength (up to 60MPa)',
        '100% Natural Clay with No Artificial Colors (Zero Fading)',
        'High Thermal Comfort & Energy Efficiency',
        'Over 30 years of expertise in natural clay materials',
        'Eco-friendly & Sustainable Building Solutions'
    ],
    transport_note: 'Rates are Ex-Factory (Transport Extra)',
    flexible_cladding_policy: 'BOSS_HANDLE'
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

    // Dynamic Coverage Calculation
    const pcsPerSqFt = product.pcsPerSqFt || 5;
    const sellingPriceSqFt = Math.ceil(sellingPricePc * pcsPerSqFt);

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
type IntentType = 'BUY_NOW' | 'PRICE_INQUIRY' | 'INSTALLATION_INQUIRY' | 'LOCATION_INQUIRY' | 'PRODUCT_INFO' | 'COMPLAINT' | 'FLEXIBLE_CLADDING' | 'SAMPLE_AGREEMENT' | 'CASUAL';

function analyzeIntent(text: string): { intent: IntentType, emotion: string, urgency: number } {
    const lower = text.toLowerCase();

    // 1. Alert Trigger: Agreement to samples/charge
    if (lower.match(/(agreed|okay|fine|approved|bhejo|bhej do|pathwa|chalel|ho)/) && (lower.includes('sample') || lower.includes('500') || lower.includes('charge'))) {
        return { intent: 'SAMPLE_AGREEMENT', emotion: 'Positive', urgency: 10 };
    }

    // 2. Special Trigger
    if (lower.includes('flexible') || lower.includes('flexi')) return { intent: 'FLEXIBLE_CLADDING', emotion: 'Neutral', urgency: 5 };

    // 3. High Urgency
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('account') || lower.includes('pay')) {
        return { intent: 'BUY_NOW', emotion: 'Anxious', urgency: 9 };
    }

    // 4. Price / Costing
    if (lower.includes('price') || lower.includes('rate') || lower.includes('cost') || lower.includes('quote') || lower.includes('kaise diya')) {
        return { intent: 'PRICE_INQUIRY', emotion: 'Curious', urgency: 7 };
    }

    // 5. Installation
    if (lower.includes('install') || lower.includes('fit') || lower.includes('labour') || lower.includes('lagane') || lower.includes('mistri')) {
        return { intent: 'INSTALLATION_INQUIRY', emotion: 'Concerned', urgency: 6 };
    }

    // 6. Location
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

// --- AI AGENT WRAPPER ---
export async function agentBrainWithAI(lead: Lead, lastMessage: string): Promise<AgentDecision> {
    if (typeof window !== 'undefined') {
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_agent_response',
                    lead,
                    lastMessage
                })
            });

            if (response.ok) {
                const decision = await response.json();
                console.log('🤖 AI Agent Decision:', decision);
                return decision;
            }
        } catch (error) {
            console.warn('AI agent failed, falling back to rule-based:', error);
        }
    }
    return agentBrain(lead, lastMessage);
}

// --- MAIN AGENT BRAIN ---
export async function agentBrain(lead: Lead, lastMessage: string): Promise<AgentDecision> {
    const lang = detectLanguage(lastMessage);
    const { intent, emotion, urgency } = analyzeIntent(lastMessage);
    const firstName = lead.name.split(' ')[0] || 'Sir/Ma\'am';

    // Default Decision
    let decision: AgentDecision = {
        action: 'DO_NOTHING',
        thoughtProcess: 'Listening...',
        typingDelayMs: 0,
        detectedLanguage: lang
    };

    // ---------------------------------------------------------
    // 0. SAMPLE AGREEMENT (Urgent Alert to Boss)
    // ---------------------------------------------------------
    if (intent === 'SAMPLE_AGREEMENT') {
        return {
            action: 'ALERT_BOSS',
            thoughtProcess: 'Client Agreed to Sample Charges (₹500). Alerting Boss for Payment/Dispatch.',
            typingDelayMs: 0,
            detectedLanguage: lang
        };
    }

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
            if (lang === 'Marathi') reply = `Namaskar ${firstName}, ${AGENT_NAME} boltoy Urban Clay madhun. Rate quantity war avalambun ahe. Tumhala sadharan kiti sqft chi requirement ahe?`;
            else if (lang === 'Hindi') reply = `Namaste ${firstName}, main ${AGENT_NAME} baat kar raha hoon Urban Clay se. Sahi rate dene ke liye, kya aap bata sakte hain ki approx kitna sqft area hai?`;
            else reply = `Hi ${firstName}, this is ${AGENT_NAME} from Urban Clay. To give you the best price, could you please confirm the approximate area (sqft) required? Qty affects the discount.`;

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
            const pitch = `This is our premium ${product.name}, fired at 1200°C for superior strength. It fits perfectly for your ${requestArea} sqft area.`;
            const transportAsk = `To calculate the transport cost for this quantity, could you please share your site PINCODE?`;

            if (lang === 'Marathi') reply = `Namaskar ${firstName}, ${pitch} Rate: ₹${pricing.rateSqFt}/sqft padel (Ex-factory). Transport cost sangnyasathi tumcha site PINCODE share karal ka?`;
            else if (lang === 'Hindi') reply = `Namaste ${firstName}, ${pitch} Aapke ${requestArea} sqft ke liye special rate ₹${pricing.rateSqFt}/sqft rahega. Transport cost jinkari ke liye, kya aap apne site ka PINCODE confirm karenge?`;
            else reply = `Hi ${firstName}, ${pitch} For your ${requestArea} sqft volume, I can offer a special rate of ₹${pricing.rateSqFt}/sqft (₹${pricing.ratePerPc}/pc).\n\n${transportAsk}`;

            return {
                action: 'REPLY',
                response: reply,
                thoughtProcess: `Calculated Price for ${requestArea}sqft: ₹${pricing.rateSqFt}/sqft. Asking for Pincode for transport.`,
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
        if (lang === 'Hindi') reply = `Haan ${firstName}, hum installation assistance dete hain. Main apne expert installation team se baat karke 30-60 mins main aapko exact labour cost batata hoon.`;
        else if (lang === 'Marathi') reply = `Ho ${firstName}, amchya kade expert fitters ahet. Mi tyanchyashi bolun ardhya tasat tumhala installation charge sangto.`;
        else reply = `Yes ${firstName}, we provide installation assistance. Let me check with our technical team and share the exact labour estimate within 30-60 minutes.`;

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
        const reply = `Hi ${firstName}, our Experience Centre is in Kharghar, Navi Mumbai (near Hotel Highway Break). We recently moved from Chembur to this bigger space. You can check the google map location here. When are you planning to visit?`;
        return {
            action: 'REPLY',
            response: reply,
            thoughtProcess: 'Shared Office Location (Kharghar). Asked for visit.',
            typingDelayMs: calculateTypingDelay(reply),
            detectedLanguage: lang
        };
    }

    // ---------------------------------------------------------
    // 5. BUYING / SAMPLES (PORTER/DTDC + 500 CHARGE)
    // ---------------------------------------------------------
    if (intent === 'BUY_NOW') {
        let reply = '';
        const chargeNote = "There will be a nominal courier charge of ₹500 for the sample box.";
        const deliveryNote = "If your site is within Mumbai, we will dispatch it via Porter bike. For locations outside Mumbai, we use DTDC courier.";

        if (lang === 'Hindi') reply = `Great ${firstName}! Hum samples bhijwa sakte hain. Iska ₹500 courier charge rahega. Mumbai ke liye hum Porter se bhejte hain aur Mumbai ke bahar DTDC se. Kya aapko ye chalega? Sahi delivery ke liye apna PINCODE confirm kijiye.`;
        else if (lang === 'Marathi') reply = `Khoop chan ${firstName}! Mi samples pathavto. Tyache ₹500 courier charges astil. Mumbai sathi Porter ani Mumbai baher sathi DTDC vaparto. Tumhala manya ahe ka? Krupaya tumcha PINCODE share kara.`;
        else reply = `That's great ${firstName}. I can arrange the sample box for you. ${chargeNote} ${deliveryNote}\n\nDoes that work for you? Also, please confirm your PINCODE.`;

        return {
            action: 'REPLY',
            response: reply,
            thoughtProcess: 'Closing on Sample Dispatch. Informed about ₹500 charge and Porter/DTDC delivery.',
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
