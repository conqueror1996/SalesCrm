import { BRICK_EXPERTISE } from './brickExpertise';
import { CustomerType } from './intelligence';

interface AIResponse {
    reply: string;
    topic?: string;
    confidence: number;
}

export function generateSmartReply(
    messageContent: string,
    customerType: CustomerType = 'Unknown'
): AIResponse {
    const lower = messageContent.toLowerCase();

    // 1. Check for Competitor Mentions (Price Objection Battle Mode)
    if (lower.includes('local') || lower.includes('flyash') || lower.includes('fly ash') || lower.includes('aac') || lower.includes('cement')) {
        let comparison = "";
        let topic = "";

        if (lower.includes('flyash') || lower.includes('fly ash')) {
            comparison = BRICK_EXPERTISE.product_comparisons.vs_flyash.join(" ");
            topic = "Fly Ash Comparison";
        } else if (lower.includes('aac')) {
            comparison = BRICK_EXPERTISE.product_comparisons.vs_aac_blocks.join(" ");
            topic = "AAC Block Comparison";
        } else {
            comparison = BRICK_EXPERTISE.product_comparisons.vs_local_handmade.join(" ");
            topic = "Local Handmade Comparison";
        }

        return {
            reply: `That's a valid comparison. However, consider the long-term value: ${comparison} With Urban Clay, you are buying a legacy product, not just a wall filler.`,
            topic: topic,
            confidence: 0.9
        };
    }

    // 2. Technical Specs Queries
    if (lower.includes('strength') || lower.includes('load') || lower.includes('floors')) {
        const spec = BRICK_EXPERTISE.technical_specs.compressive_strength;
        return {
            reply: `Our bricks are machine-pressed to ${spec.value} compressive strength. To give you context, ${spec.comparison.toLowerCase()} This means you can easily build up to 3 floors load-bearing without RCC pillars.`,
            topic: "Strength Specs",
            confidence: 0.95
        };
    }

    if (lower.includes('water') || lower.includes('damp') || lower.includes('leak') || lower.includes('rain')) {
        const spec = BRICK_EXPERTISE.technical_specs.water_absorption;
        return {
            reply: `Water absorption is critical for exposed work. Ours is ${spec.value}, whereas ${spec.comparison.toLowerCase()} This low porosity ensures ${spec.benefit.toLowerCase()}`,
            topic: "Water Absorption",
            confidence: 0.95
        };
    }

    // 3. Price/Value Objection
    if (lower.includes('price') || lower.includes('cost') || lower.includes('expensive') || lower.includes('rate')) {
        if (customerType === 'Architect') {
            return {
                reply: `For the premium finish you are designing, the cost per sq.ft impact is minimal compared to the aesthetic value. ${BRICK_EXPERTISE.technical_specs.firing_process.details} This ensures the color never fades.`,
                topic: "Premium Value (Architect)",
                confidence: 0.85
            };
        }
        return {
            reply: BRICK_EXPERTISE.sales_scripts.objection_price,
            topic: "Price Calculation",
            confidence: 0.9
        };
    }

    // 4. Default / General Inquiry
    if (customerType === 'Architect') {
        return {
            reply: BRICK_EXPERTISE.sales_scripts.intro_architect,
            topic: "Architect Intro",
            confidence: 0.8
        };
    }

    return {
        reply: BRICK_EXPERTISE.sales_scripts.intro_homeowner,
        topic: "Homeowner Intro",
        confidence: 0.7
    };
}
