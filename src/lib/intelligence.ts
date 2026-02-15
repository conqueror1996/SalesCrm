import { Message, Lead } from '../data/mockData';

export type CustomerType = 'Architect' | 'Builder' | 'Contractor' | 'Homeowner' | 'Unknown';
export type LeadScore = 'HOT 🔥' | 'WARM 🟡' | 'COLD ❄️' | 'TIMEPASS 🤡' | 'DEAD ⚫';

// ... (existing code)

// ... (existing code top)
export type Intent = 'Price Check' | 'Buying' | 'Planning' | 'Design Exploration' | 'Comparison';
export type PipelineStage = 'Lead' | 'Sampling' | 'Quotation' | 'Negotiation' | 'Closed';

export type SuggestedAction = {
    label: string;
    actionType: 'send_photos' | 'send_site_image' | 'send_estimate' | 'ask_question' | 'custom_reply' | 'log_qualification';
    payload?: any;
    tone?: 'Professional' | 'Friendly' | 'Premium' | 'Urgent' | 'Direct';
    description?: string;
};

export type AIGuidance = {

    // Core AI Stats
    leadScore: LeadScore; // OLD Hot/Warm/Cold
    seriousBuyerScore: number; // NEW 0-100
    heatColor: 'red' | 'yellow' | 'blue'; // NEW Visual

    // Context
    intent: Intent;
    summary: string;
    nextStep: string;
    suggestions: SuggestedAction[];
    personaComment: string;

    // Deal Data
    customerType: CustomerType;
    estimatedValue?: string;
    numericValue?: number;
    isHighValue?: boolean;
    location?: string;

    // Status Flags
    qualificationStatus: 'pending' | 'partially_qualified' | 'qualified';
    ghostingStatus: 'Safe' | 'Risk' | 'Ghosted';
    decisionPressure: 'Fast Mover' | 'Thinking' | 'Delay Zone' | 'Dropping';

    // Action Indicators
    closingWindow: boolean; // "Best moment to close"
    objectionDetected?: 'Price' | 'Vendor' | 'Delay' | 'None';

    // Existing useful stuff
    sampleDetection?: { detected: boolean; item?: string; };
    climateStrategy?: { label: string; advice: string; productFocus: string; };

    // Legacy fields to prevent build errors
    productRequirement?: string;
    pipelineStage?: PipelineStage;
};

export function getGlobalStats(leads: Lead[]) {
    // 1. Calculate Revenue (Total Deal Value of Closed/Hot leads or manual aggregation)
    // For now, let's sum up numericValue of all leads as "Pipeline Value" or similar
    // Or just use the mock logic from before.

    const totalRevenue = leads.reduce((acc, lead) => {
        // If we had a 'closed' status with value, we'd sum that.
        // For now, let's sum estimated value of HOT leads as "Projected Revenue"
        // or just return a dummy stat if real data isn't there.
        // Let's assume 'dealValue' property exists on Lead (it does in mockData)
        return acc + (lead.dealValue || 0);
    }, 0);

    const totalLeads = leads.length;
    // Fix: access guidenc via some helper or assume it's attached?
    // The previous code in page.tsx calls getGlobalStats(leads).
    // But 'leads' in page.tsx has 'guidance' attached?
    // Actually, page.tsx has `leads` state which initializes from INITIAL_LEADS.
    // getGlobalStats was likely removed during the rewrite. logic needs to be restored.

    // Let's rely on what we can see in Lead.
    // We can't easily see 'leadScore' without re-running analyzeContext or assuming it's stored.
    // But wait, page.tsx stores `leads` which are `Lead[]`.
    // And it has a memoized `scoredLeads` which adds `guidance`.
    // But `getGlobalStats` is called with `leads` (raw).

    // Let's implement a simple version that doesn't need guidance, OR
    // we change the signature to accept scored leads?
    // The error says: Module '"../lib/intelligence"' has no exported member 'getGlobalStats'.
    // So we just need to export it.

    const hotLeads = leads.filter(l => l.tags.includes('hot') || (l.dealValue > 500000)).length;

    return {
        totalRevenue: leads.reduce((acc, lead) => acc + (lead.dealValue || 0), 0),
        totalLeads: leads.length,
        hotLeads
    };
}


// --- CORE LOGIC HANDLERS ---

function calculateSeriousBuyerScore(lead: Lead, text: string): { score: number, color: 'red' | 'yellow' | 'blue' } {
    let score = 30; // Base presence
    const lower = text.toLowerCase();

    // 1. Qualification Data (The biggest signal)
    if (lead.qualificationStatus === 'qualified') score += 30;
    if (lead.projectType === 'villa' || lead.projectType === 'commercial') score += 15;
    if (lead.estimatedArea && lead.estimatedArea > 2000) score += 10;

    // 2. Behavioral Signals
    if (lead.clientProfiler?.responsiveness === 'Fast') score += 10;
    if (lead.clientProfiler?.seriousnessScore === 'High') score += 10;

    // 3. Keyword Signals
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('start work')) score += 15;
    if (lower.includes('budget') || lower.includes('account') || lower.includes('transfer')) score += 15;
    if (lower.includes('sample') || lower.includes('visit') || lower.includes('site')) score += 10;

    // 4. Penalties
    if (lower.includes('rate') && text.split(' ').length < 5) score -= 15; // Just "rate?"
    if (lower.includes('expensive') || lower.includes('discount')) score -= 5; // Negotiator (not necessarily bad, but slows down)

    // Clamp
    score = Math.min(Math.max(score, 0), 100);

    let color: 'red' | 'yellow' | 'blue' = 'blue';
    if (score > 75) color = 'red';
    else if (score > 40) color = 'yellow';

    return { score, color };
}

function detectObjection(text: string): 'Price' | 'Vendor' | 'Delay' | 'None' {
    const lower = text.toLowerCase();
    if (lower.includes('expensive') || lower.includes('costly') || lower.includes('budget') || lower.includes('more than') || lower.includes('discount')) return 'Price';
    if (lower.includes('other') || lower.includes('vendor') || lower.includes('brand') || lower.includes('market')) return 'Vendor';
    if (lower.includes('later') || lower.includes('wait') || lower.includes('ask') || lower.includes('confirm') || lower.includes('next month')) return 'Delay';
    return 'None';
}

function detectGhostingStatus(lead: Lead): 'Safe' | 'Risk' | 'Ghosted' {
    if (!lead.lastActive) return 'Safe';
    const hoursInactive = (new Date().getTime() - new Date(lead.lastActive).getTime()) / (1000 * 60 * 60);

    if (hoursInactive > 120) return 'Ghosted'; // 5 days
    if (hoursInactive > 48) return 'Risk'; // 2 days
    return 'Safe';
}

function detectDecisionPressure(lead: Lead): 'Fast Mover' | 'Thinking' | 'Delay Zone' | 'Dropping' {
    // In a real app, track firstContactDate. Mock logic:
    if (lead.clientProfiler?.responsiveness === 'Fast') return 'Fast Mover';

    const hoursInactive = (new Date().getTime() - new Date(lead.lastActive).getTime()) / (1000 * 60 * 60);
    if (hoursInactive > 168) return 'Dropping'; // 7 days
    if (hoursInactive > 72) return 'Delay Zone'; // 3 days
    return 'Thinking';
}

// Reuse existing enhanced detection
function detectCustomerType(text: string): CustomerType {
    const lower = text.toLowerCase();
    if (lower.includes('architect') || lower.includes('design') || lower.includes('elevation')) return 'Architect';
    if (lower.includes('bulk') || lower.includes('project') || lower.includes('builder')) return 'Builder';
    if (lower.includes('contractor') || lower.includes('labour')) return 'Contractor';
    if (lower.includes('home') || lower.includes('villa') || lower.includes('house')) return 'Homeowner';
    return 'Unknown';
}

function estimateOrderValue(text: string, type: CustomerType, area?: number): { str: string, val: number, isHigh: boolean } {
    let val = 50000; // default

    if (area) {
        val = area * 55; // Avg brick tile cost
    } else {
        if (type === 'Builder') val = 1000000;
        else if (type === 'Architect') val = 300000;
        else if (type === 'Homeowner') val = 150000;

        if (text.includes('villa')) val = 500000;
        if (text.includes('tower')) val = 2000000;
    }

    const str = `₹${(val / 100000).toFixed(1)}L+`;
    const isHigh = val > 200000;

    return { str, val, isHigh };
}


function detectPipelineStage(lead: Lead, text: string): PipelineStage {
    const lower = text.toLowerCase();

    // 1. Closed/Success
    if (lead.status === 'closed' || lower.includes('payment done') || lower.includes('booked')) return 'Closed';

    // 2. Negotiation (Must have received a quote and discussing price)
    const quoteSent = lead.messages.some(m => m.content.toLowerCase().includes('quotation') || m.content.toLowerCase().includes('estimate') || m.content.includes('₹'));
    if (quoteSent) {
        if (lower.includes('discount') || lower.includes('rate') || lower.includes('expensive') || lower.includes('budget') || lower.includes('final')) {
            return 'Negotiation';
        }
        // If just quote sent but no specific negotiation text, stay in Quotation
        return 'Quotation';
    }

    // 3. Sampling / Interest
    if (lead.sampleRequest || lower.includes('sample') || lower.includes('photo') || lower.includes('catalog') || lower.includes('images')) {
        return 'Sampling';
    }

    // 4. Default Inbound
    return 'Lead';
}

function generateDynamicDraft(lead: Lead, context: any): string {
    const { customerType, pipelineStage, climateStrategy, objectionDetected } = context;
    const name = lead.name.split(' ')[0] || 'Sir/Ma\'am';

    // 1. Negotiation Phase
    if (pipelineStage === 'Negotiation') {
        if (customerType === 'Builder') return `Hi ${name}, for a bulk project like yours, the long-term value of our wirecut bricks far outweighs the small price difference. I can stretch to give you free unloading if we close today.`;
        return `Hi ${name}, I understand the budget. However, this is a one-time elevation investment. Our bricks ensure zero maintenance for 50 years. Can we proceed?`;
    }

    // 2. Quotation Followup
    if (pipelineStage === 'Quotation') {
        return `Hi ${name}, hope you reviewed the estimate. Since you are in ${climateStrategy.label === 'Coastal/High Rain' ? 'a high rain zone' : 'this area'}, our ${climateStrategy.productFocus} is the perfect technical fit. Shall I block the stock?`;
    }

    // 3. New Lead / Qualification
    if (pipelineStage === 'Lead' || !lead.qualificationStatus || lead.qualificationStatus === 'pending') {
        if (customerType === 'Architect') return `Hi Ar. ${name}, glad to connect. To assist better with the facade design, could you share the project location and approximate cladding area?`;

        // Only give the generic homeowner pitch if we really have NO other info
        if (customerType === 'Homeowner' && lead.messages.length <= 2) {
            return `Hi ${name}, congratulations on your new home! To suggest the best elevation designs, are you looking for a red brick look or something more modern like grey/black?`;
        }

        return `Hi ${name}, thanks for inquiring. To give you the correct rate card, could you confirm the delivery location?`;
    }

    // 4. Sampling
    if (pipelineStage === 'Sampling') {
        return `Hi ${name}, sharing the latest site photos of our ${climateStrategy.productFocus}. Would you like to see physical samples at your site in ${lead.siteLocation || 'your area'}?`;
    }

    return `Hi ${name}, how can I help you with your elevation requirements today?`;
}

// --- MAIN AI ANALYSIS ---

/**
 * AI-Powered Analysis (with fallback to rule-based)
 * This function attempts to use real AI first, then falls back to rules if AI fails
 */
export async function analyzeContextWithAI(lead: Lead, lastMessage: Message): Promise<AIGuidance> {
    // Try AI first (only in browser/client-side, we'll call the API)
    if (typeof window !== 'undefined') {
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze_lead',
                    lead,
                    lastMessage
                })
            });

            if (response.ok) {
                const aiGuidance = await response.json();
                console.log('✨ AI Analysis:', aiGuidance);
                return aiGuidance;
            }
        } catch (error) {
            console.warn('AI analysis failed, using rule-based fallback:', error);
        }
    }

    // Fallback to rule-based analysis
    return analyzeContext(lead, lastMessage);
}

/**
 * Rule-Based Analysis (Fallback)
 * Original logic preserved for reliability
 */
export function analyzeContext(lead: Lead, lastMessage: Message): AIGuidance {
    const text = lastMessage.content.toLowerCase();

    // 1. Base Detection
    const customerType = lead.projectType ?
        (lead.projectType === 'commercial' ? 'Builder' : lead.projectType === 'villa' ? 'Homeowner' : detectCustomerType(text))
        : detectCustomerType(text);

    const { score: seriousScore, color: heatColor } = calculateSeriousBuyerScore(lead, text);
    const { str: estVal, val: numVal, isHigh: highVal } = estimateOrderValue(text, customerType, lead.estimatedArea);

    const ghostStatus = detectGhostingStatus(lead);
    const pressure = detectDecisionPressure(lead);
    const objection = detectObjection(text);
    const pipelineStage = detectPipelineStage(lead, text);

    // 2. Closing Window Logic
    // If sample delivered OR quote sent, AND they are replying -> Good time to close
    const quoteSent = lead.messages.some(m => m.content.includes('Quotation #'));
    const sampleDelivered = lead.sampleRequest?.status === 'delivered';
    const activeDiscussion = lead.clientProfiler?.responsiveness === 'Fast';
    const closingWindow = (quoteSent || sampleDelivered) && activeDiscussion;

    // 3. Suggestions Builder
    let suggestions: SuggestedAction[] = [];
    let summary = 'Review lead details.';
    let nextStep = 'Engage.';
    let personaComment = '';

    // A. Mandatory Qualification Check
    if (!lead.qualificationStatus || lead.qualificationStatus === 'pending') {
        summary = 'Unqualified Lead. Missing key details.';
        nextStep = 'Capture Qualification Data.';
        suggestions.push({
            label: '⚠️ Qualify Lead',
            actionType: 'log_qualification', // Triggers Modal
            description: 'Mandatory: Site, Type, Area',
            tone: 'Urgent'
        });
        // Also add conversational probe
        suggestions.push({
            label: 'Ask: Project Details',
            actionType: 'ask_question',
            payload: 'To suggest the right Series, could you share the project location and approximate elevation area?',
            description: 'Soft qualify',
            tone: 'Professional'
        });
    }

    // B. Price Defense (Negotiation Control)
    else if (objection === 'Price') {
        summary = 'Price Objection Detected.';
        nextStep = 'Defend Value. Do not discount yet.';
        personaComment = 'Hold the line. They want it, they just want to feel they won the negotiation.';

        suggestions.push({
            label: '🛡️ Value Defense',
            actionType: 'custom_reply',
            tone: 'Premium',
            payload: 'I understand the budget concern. However, with Urban Clay\'s 30+ years of expertise, you aren\'t just buying bricks. Our clay is fired at 1200°C to reach a massive 60MPa compressive strength—that is 3x stronger than standard market bricks. It ensures zero fading and zero maintenance for a lifetime.',
            description: 'Justify with Quality & Legacy'
        });
        suggestions.push({
            label: '⏳ Scarcity Push',
            actionType: 'custom_reply',
            tone: 'Urgent',
            payload: 'The best I can do is freeze the old stock rate for you if we book today. We only have 2500 units left in this lot. Shall I block it?',
            description: 'Create Urgency'
        });
        suggestions.push({
            label: '🔄 Product Swap',
            actionType: 'custom_reply',
            tone: 'Professional',
            payload: 'If budget is tight, we can look at our "Classic" series range. It has the same strength but simpler texture, saving you ₹8 per sq ft. Should I send photos?',
            description: 'Alternative Solution'
        });
    }

    // C. Ghosting Recovery
    else if (ghostStatus === 'Risk') {
        summary = 'Lead is drifting away (48h+ inactive).';
        nextStep = 'Send soft check-in.';
        suggestions.push({
            label: 'Soft Nudge',
            actionType: 'custom_reply',
            payload: 'Hi, just checking if you had a chance to discuss the designs with your family/architect?',
            tone: 'Friendly'
        });
    } else if (ghostStatus === 'Ghosted') {
        summary = 'Lead is unresponsive (5d+).';
        nextStep = 'Trigger Loss Aversion.';
        personaComment = 'They are gone unless you shock them.';
        suggestions.push({
            label: '🛑 Stock Release Warning',
            actionType: 'custom_reply',
            tone: 'Direct',
            payload: 'Hi, since I haven\'t heard back, I assume you are holding off. I am releasing the block on your requested batch for another client today. Let me know if you change your mind.',
            description: 'The "Takeaway" Close'
        });
    }

    // D. Closing Window / Assumption Close
    if (closingWindow || activeDiscussion) {
        suggestions.push({
            label: '🤝 Assumption Close (Dates)',
            actionType: 'ask_question',
            payload: 'We have a truck leaving for your area on Tuesday. If we finalize today, I can include your dispatch. Does that routing work for you?',
            description: 'Assume the sale',
            tone: 'Urgent'
        });
        suggestions.push({
            label: '📝 Assumption Close (Invoice)',
            actionType: 'ask_question',
            payload: 'Should I generate the proforma invoice in the name of your company or personal name?',
            description: 'Direct step to money',
            tone: 'Professional'
        });
    }



    // Climate Logic (Preserved)
    // Climate Logic
    const climateStrategy = {
        label: 'Standard',
        advice: 'Focus on durability',
        productFocus: 'All Products'
    };
    if (lead.siteLocation || lead.messages.some(m => m.content.toLowerCase().includes('mumbai'))) {
        climateStrategy.label = 'Coastal/High Rain';
        climateStrategy.advice = 'Pitch low water absorption (<6%).';
        climateStrategy.productFocus = 'Wirecut Series';
    }

    // Fallback / Smart Draft
    if (suggestions.length < 3) {
        // Generate a context-aware smart draft
        const smartDraft = generateDynamicDraft(lead, {
            customerType,
            pipelineStage,
            climateStrategy,
            objectionDetected: objection // Correct variable name from scope
        });

        suggestions.push({
            label: '✨ AI Smart Draft',
            actionType: 'custom_reply',
            payload: smartDraft,
            description: 'Context-aware auto-reply',
            tone: 'Professional'
        });
    }

    return {
        leadScore: seriousScore > 75 ? 'HOT 🔥' : seriousScore > 40 ? 'WARM 🟡' : 'COLD ❄️',
        seriousBuyerScore: seriousScore,
        heatColor,
        intent: 'Buying', // simplified for now
        summary,
        nextStep,
        suggestions: suggestions.slice(0, 4),
        personaComment: personaComment || 'Guide them to the next step.',
        customerType,
        estimatedValue: estVal,
        numericValue: numVal,
        isHighValue: highVal,
        location: lead.siteLocation,
        qualificationStatus: lead.qualificationStatus || 'pending',
        ghostingStatus: ghostStatus,
        decisionPressure: pressure,
        closingWindow,
        objectionDetected: objection,
        climateStrategy,
        pipelineStage // ADDED THIS
    };
}
