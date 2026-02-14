
import { Lead, Message } from './data/mockData';

// --- CONFIGURATION ---
const BOSS_PHONE_NUMBER = process.env.NEXT_PUBLIC_BOSS_PHONE || '919876543210';
const AGENT_NAME = 'SalesHero';

// --- TYPES ---
export type AgentState = 'IDLE' | 'THINKING' | 'TYPING' | 'WAITING_FOR_BOSS' | 'ACTIVE';

export interface AgentDecision {
    action: 'REPLY' | 'ALERT_BOSS' | 'DO_NOTHING' | 'WAIT';
    response?: string;
    thoughtProcess: string;
    typingDelayMs: number;
    detectedLanguage: 'English' | 'Hindi' | 'Marathi';
}

// --- LANGUAGE DETECTION (Basic Heuristic) ---
function detectLanguage(text: string): 'English' | 'Hindi' | 'Marathi' {
    const lower = text.toLowerCase();
    // Marathi specific common words
    if (lower.match(/(aahe|pahije|kuth|kay|bol|kasa|mi|tula)/)) return 'Marathi';
    // Hindi specific common words
    if (lower.match(/(hai|kya|kaise|main|tum|aap|chahiye|bhai)/)) return 'Hindi';
    return 'English';
}

// --- EMOTION & INTENT ANALYSIS (Simulated LLM) ---
function analyzeIntent(text: string): { intent: string, emotion: string, urgency: number } {
    const lower = text.toLowerCase();

    // High Urgency
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('now')) {
        return { intent: 'BUY_NOW', emotion: 'Anxious', urgency: 9 };
    }

    // Angry
    if (lower.includes('waste') || lower.includes('late') || lower.includes('bad') || lower.includes('expensive')) {
        return { intent: 'COMPLAINT', emotion: 'Angry', urgency: 8 };
    }

    // Interested
    if (lower.includes('sample') || lower.includes('price') || lower.includes('rate') || lower.includes('visit')) {
        return { intent: 'INQUIRY', emotion: 'Curious', urgency: 6 };
    }

    // Casual
    return { intent: 'CASUAL', emotion: 'Neutral', urgency: 2 };
}

// --- HUMAN MIMICRY ---
function calculateTypingDelay(response: string): number {
    // Average human typing speed: ~190 chars per minute (approx 3 chars per second)
    // Plus thinking time (1.5s)
    const typingSpeedPerCharMs = 250;
    const thinkingTimeMs = 1500;
    const baseDelay = (response.length * typingSpeedPerCharMs) + thinkingTimeMs;

    // Add some random variance (jitter)
    const jitter = Math.random() * 2000;

    // Cap at 15 seconds to avoid too long waits
    return Math.min(baseDelay + jitter, 15000);
}

// --- MAIN AGENT BRAIN ---
export async function agentBrain(lead: Lead, lastMessage: string): Promise<AgentDecision> {
    const lang = detectLanguage(lastMessage);
    const { intent, emotion, urgency } = analyzeIntent(lastMessage);

    let decision: AgentDecision = {
        action: 'DO_NOTHING',
        thoughtProcess: 'Analyzing...',
        typingDelayMs: 0,
        detectedLanguage: lang
    };

    // 1. BOSS ALERT TRIGGER
    // If client is angry or deal value is extremely high, call the boss.
    if (emotion === 'Angry' || (lead.dealValue && lead.dealValue > 1000000)) {
        return {
            action: 'ALERT_BOSS',
            thoughtProcess: `Client is ${emotion} and high priority. Risk of losing deal. Alerting Boss.`,
            typingDelayMs: 0,
            detectedLanguage: lang
        };
    }

    // 2. SALES RESPONSE GENERATION (Templates for now, LLM later)
    if (intent === 'INQUIRY' || intent === 'BUY_NOW') {
        let reply = '';
        if (lang === 'Marathi') {
            reply = `Namaskar ${lead.name.split(' ')[0]}, mi ${AGENT_NAME}. Tumchi requirement samajli. Aapan sample pathvu shakto. Tumhi site location pathval ka?`;
        } else if (lang === 'Hindi') {
            reply = `Namaste ${lead.name.split(' ')[0]}, ${AGENT_NAME} here. Maine aapki requirement dekhi. Kya aap site location share kar sakte hain taaki main sahi samples suggest karoon?`;
        } else {
            reply = `Hi ${lead.name.split(' ')[0]}, ${AGENT_NAME} here. I understand your requirement. Could you share your site location so I can suggest the perfect samples?`;
        }

        decision = {
            action: 'REPLY',
            response: reply,
            thoughtProcess: `Client is ${emotion}. Detected ${lang}. Aiming to get Site Location for samples.`,
            typingDelayMs: calculateTypingDelay(reply),
            detectedLanguage: lang
        };
    } else {
        // Default / Casual
        decision = {
            action: 'REPLY',
            response: lang === 'Hindi' ? "Ji boliye, main kaise madad kar sakta hoon?" : "Sure, how can I help you?",
            thoughtProcess: "General inquiry. Keeping it open.",
            typingDelayMs: 3000,
            detectedLanguage: lang
        };
    }

    return decision;
}

// --- BOSS ALERT SYSTEM ---
export function formatBossAlert(lead: Lead, decision: AgentDecision): string {
    return `🚨 *BOSS ALERT* 🚨
    
    *Client:* ${lead.name} (${lead.phone})
    *Status:* ${decision.thoughtProcess}
    *Reason:* High Urgency/Emotion Detected
    *Action Required:* Please takeover chat immediately. Agent has paused.
    
    [Reply 'RESUME' to re-activate Agent]`;
}
