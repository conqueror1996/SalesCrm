import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, Message } from '../data/mockData';
import { AIGuidance, CustomerType, LeadScore } from './intelligence';
import { AgentDecision } from './sales-agent';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Company Context for AI
const COMPANY_CONTEXT = `
You are Rahul, the Sales Manager for Urban Clay, a premium terracotta and clay brick manufacturer in India.
Urban Clay has over 30 years of expertise and is known for high-performance, natural clay building materials.

**Company Details:**
- Name: Urban Clay
- Locations: Kharghar, Navi Mumbai (Experience Centre), Factory in Madhya Pradesh. 
- Products: Exposed Wirecut bricks, Perforated bricks, terracotta wall cladding tiles, jalis (breeze blocks), floor tiles, and Mangalore roof tiles.

**Technical Specifications (USPs):**
- Firing: All products are fired at 1200°C for superior durability and color stability.
- Strength: High-performance bricks reach up to 60MPa compressive strength (3x stronger than standard market bricks).
- Maintenance: Zero maintenance for 50+ years; natural clay colors never fade.
- Absorption: Low water absorption (<10% to 12%).
- Eco-friendly: 100% natural clay with no artificial colors or chemicals.

**Commercial & Logistics Policies:**
- Pricing: Margin is 39% for <600 sqft, 29% for 600-5000 sqft, 19% for >5000 sqft.
- Rates: All rates are Ex-Factory. Always ask for the client's site PINCODE to calculate accurate transport costs based on quantity.
- Cladding Pricing: Cladding tiles range from ₹10 to ₹45 per piece depending on selection. Sqft rates range from ₹145 to ₹220/sqft (approx 5.33 pcs/sqft).
- Samples: There is a mandatory courier charge of ₹500 for a sample box. 
    * Mumbai deliveries: via Porter bike.
    * Outside Mumbai: via DTDC courier.
- Policy: Always ask for PINCODE early. If a client agrees to the ₹500 sample charge, stop and notify the boss immediately.

**Major Projects (Social Proof):**
- Bade-Miyan Restaurant, Mumbai: Features our Exposed Wirecut Bricks and Terracotta Cladding.
- HITAM Campus, Hyderabad: Demonstrates large-scale Terracotta Facade installations for institutional cooling.
- St. Marks Hotel, Bangalore: Highlights our intricate Terracotta Jali (Screen Bricks) work.
- Use these projects to build trust, especially when dealing with Architects and Developers.

**Persona:**
- Professional, knowledgeable, and consultative.
- Use the customer's name naturally (Personal Connection).
- Multilingual: Detect and respond in English, Hindi, or Marathi as preferred by the client.
- Value defense: When a lead finds the price high, defend value by mentioning the 30-year legacy and 60MPa strength.
`;

/**
 * Analyze lead context and generate AI-powered guidance
 */
export async function analyzeLeadWithAI(lead: Lead, lastMessage: Message): Promise<AIGuidance> {
    const conversationHistory = lead.messages
        .slice(-5) // Last 5 messages for context
        .map(m => `${m.sender === 'client' ? 'Customer' : 'Sales Rep'}: ${m.content}`)
        .join('\n');

    const prompt = `${COMPANY_CONTEXT}

**Lead Information:**
- Name: ${lead.name}
- Phone: ${lead.phone}
- Source: ${lead.tags.join(', ')}
- Status: ${lead.status}
- Project Type: ${lead.projectType || 'Unknown'}
- Estimated Area: ${lead.estimatedArea || 'Unknown'} sqft
- Site Location: ${lead.siteLocation || 'Unknown'}
- Qualification Status: ${lead.qualificationStatus || 'pending'}

**Recent Conversation:**
${conversationHistory}

**Latest Message from Customer:**
"${lastMessage.content}"

**Your Task:**
Analyze this lead and provide a comprehensive sales intelligence report in JSON format with the following structure:

{
  "leadScore": "HOT 🔥" | "WARM 🟡" | "COLD ❄️" | "TIMEPASS 🤡" | "DEAD ⚫",
  "seriousBuyerScore": <0-100>,
  "customerType": "Architect" | "Builder" | "Contractor" | "Homeowner" | "Unknown",
  "intent": "Price Check" | "Buying" | "Planning" | "Design Exploration" | "Comparison",
  "summary": "<brief 1-line summary of lead status>",
  "nextStep": "<recommended next action>",
  "personaComment": "<internal sales tip/insight>",
  "estimatedValue": "<e.g., ₹2.5L+>",
  "isHighValue": <boolean>,
  "qualificationStatus": "pending" | "partially_qualified" | "qualified",
  "ghostingStatus": "Safe" | "Risk" | "Ghosted",
  "decisionPressure": "Fast Mover" | "Thinking" | "Delay Zone" | "Dropping",
  "closingWindow": <boolean>,
  "objectionDetected": "Price" | "Vendor" | "Delay" | "None",
  "suggestions": [
    {
      "label": "<action label>",
      "actionType": "send_photos" | "send_estimate" | "ask_question" | "custom_reply",
      "payload": "<suggested message text if custom_reply>",
      "description": "<why this action>",
      "tone": "Professional" | "Friendly" | "Premium" | "Urgent"
    }
  ]
}

**Scoring Guidelines:**
- HOT 🔥: Ready to buy, has budget, timeline, authority (80-100 score)
- WARM 🟡: Interested, qualified, needs nurturing (40-79 score)
- COLD ❄️: Early stage, exploring options (20-39 score)
- TIMEPASS 🤡: Just asking rates, no real intent (0-19 score)

**Important:**
- Be realistic about buyer intent
- Detect price objections and suggest value-based responses
- Identify if lead needs qualification (missing area/location/project type)
- Suggest 2-4 actionable next steps
- Consider ghosting risk based on last activity time

Return ONLY valid JSON, no additional text.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        const aiGuidance = JSON.parse(jsonMatch[0]);

        // Ensure all required fields are present with defaults
        return {
            leadScore: aiGuidance.leadScore || 'COLD ❄️',
            seriousBuyerScore: aiGuidance.seriousBuyerScore || 30,
            heatColor: aiGuidance.seriousBuyerScore > 75 ? 'red' : aiGuidance.seriousBuyerScore > 40 ? 'yellow' : 'blue',
            customerType: aiGuidance.customerType || 'Unknown',
            intent: aiGuidance.intent || 'Planning',
            summary: aiGuidance.summary || 'Analyzing lead...',
            nextStep: aiGuidance.nextStep || 'Engage with lead',
            personaComment: aiGuidance.personaComment || 'Follow standard sales process',
            estimatedValue: aiGuidance.estimatedValue || '₹0.5L+',
            numericValue: parseEstimatedValue(aiGuidance.estimatedValue),
            isHighValue: aiGuidance.isHighValue || false,
            qualificationStatus: aiGuidance.qualificationStatus || 'pending',
            ghostingStatus: aiGuidance.ghostingStatus || 'Safe',
            decisionPressure: aiGuidance.decisionPressure || 'Thinking',
            closingWindow: aiGuidance.closingWindow || false,
            objectionDetected: aiGuidance.objectionDetected || 'None',
            suggestions: aiGuidance.suggestions || [],
            location: lead.siteLocation
        };
    } catch (error) {
        console.error('AI Analysis Error:', error);
        // Fallback to basic analysis
        return getFallbackGuidance(lead, lastMessage);
    }
}

/**
 * Generate AI-powered sales agent response
 */
export async function generateAgentResponse(lead: Lead, lastMessage: string): Promise<AgentDecision> {
    const conversationHistory = lead.messages
        .slice(-3)
        .map(m => `${m.sender === 'client' ? 'Customer' : 'You'}: ${m.content}`)
        .join('\n');

    const prompt = `${COMPANY_CONTEXT}

**Your Role:** You are Rahul, a sales manager at Urban Clay. Respond to customer inquiries professionally.

**Lead Details:**
- Name: ${lead.name}
- Project: ${lead.projectType || 'Unknown'}
- Area: ${lead.estimatedArea || 'Not specified'} sqft
- Location: ${lead.siteLocation || 'Not specified'}

**Conversation History:**
${conversationHistory}

**Customer's Latest Message:**
"${lastMessage}"

**Instructions:**
1. Detect the language (English/Hindi/Marathi)
2. Analyze the intent and urgency
3. Decide on action: REPLY, ALERT_BOSS, or WAIT
4. If REPLY, generate a natural, human-like response

**Special Rules:**
- If customer asks about "flexible cladding" → ALERT_BOSS
- If customer is angry/complaining → ALERT_BOSS
- If asking for price without area → Ask for area first
- If asking for installation → Offer to check with team (30-60 min)
- Always maintain professional but friendly tone
- Use customer's name naturally
- For pricing, calculate based on margin rules (39%/29%/19%)

**Response Format (JSON):**
{
  "action": "REPLY" | "ALERT_BOSS" | "WAIT",
  "response": "<your message to customer>",
  "thoughtProcess": "<internal reasoning>",
  "detectedLanguage": "English" | "Hindi" | "Marathi",
  "typingDelayMs": <realistic typing delay 2000-8000>
}

Return ONLY valid JSON.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in AI response');
        }

        const decision: AgentDecision = JSON.parse(jsonMatch[0]);
        return decision;
    } catch (error) {
        console.error('Agent AI Error:', error);
        return {
            action: 'WAIT',
            thoughtProcess: 'AI service temporarily unavailable',
            typingDelayMs: 0,
            detectedLanguage: 'English'
        };
    }
}

/**
 * Generate smart reply suggestions
 */
export async function generateSmartReplyWithAI(
    messageContent: string,
    customerType: CustomerType,
    leadContext?: Partial<Lead>
): Promise<{ reply: string; topic: string; confidence: number }> {
    const prompt = `${COMPANY_CONTEXT}

**Customer Type:** ${customerType}
**Customer Message:** "${messageContent}"
**Lead Context:** ${leadContext ? JSON.stringify(leadContext) : 'Limited info'}

Generate a professional, value-focused reply that:
1. Addresses their specific question/concern
2. Reinforces Urban Clay's premium positioning
3. Moves the conversation toward qualification or closing
4. Uses technical specs when relevant
5. Handles objections with value, not discounts

**Response Format (JSON):**
{
  "reply": "<your suggested response>",
  "topic": "<what this addresses>",
  "confidence": <0.0-1.0>
}

Return ONLY valid JSON.`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Smart Reply AI Error:', error);
        return {
            reply: 'Thank you for your inquiry. Let me get back to you with the details.',
            topic: 'General Response',
            confidence: 0.5
        };
    }
}

// Helper functions
function parseEstimatedValue(valueStr: string): number {
    const match = valueStr.match(/₹?([\d.]+)([LCK])?/i);
    if (!match) return 50000;

    const num = parseFloat(match[1]);
    const unit = match[2]?.toUpperCase();

    if (unit === 'L') return num * 100000;
    if (unit === 'C') return num * 10000000;
    if (unit === 'K') return num * 1000;
    return num;
}

function getFallbackGuidance(lead: Lead, lastMessage: Message): AIGuidance {
    // Basic fallback when AI fails
    return {
        leadScore: 'WARM 🟡',
        seriousBuyerScore: 50,
        heatColor: 'yellow',
        customerType: 'Unknown',
        intent: 'Planning',
        summary: 'Lead requires analysis',
        nextStep: 'Engage and qualify',
        personaComment: 'Standard follow-up needed',
        estimatedValue: '₹1L+',
        numericValue: 100000,
        isHighValue: false,
        qualificationStatus: 'pending',
        ghostingStatus: 'Safe',
        decisionPressure: 'Thinking',
        closingWindow: false,
        objectionDetected: 'None',
        suggestions: [
            {
                label: 'Ask Project Details',
                actionType: 'ask_question',
                payload: 'Could you share your project location and approximate area requirement?',
                description: 'Qualify the lead',
                tone: 'Professional'
            }
        ],
        location: lead.siteLocation
    };
}
