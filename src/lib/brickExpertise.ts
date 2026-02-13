export const BRICK_EXPERTISE = {
    technical_specs: {
        compressive_strength: {
            value: "35 MPa",
            comparison: "Standard local bricks are 3-5 MPa. Fly ash bricks are 7-10 MPa.",
            benefit: "Equivalent to M35 grade concrete. Suitable for load-bearing walls up to 3 floors without pillars."
        },
        water_absorption: {
            value: "< 6%",
            comparison: "Handmade local bricks absorb 15-20% water.",
            benefit: "Prevents efflorescence (white patches), dampness, and moss growth. Zero fungal attacks for 50+ years."
        },
        firing_process: {
            details: "Fired at 1050°C - 1100°C for 48 hours in a zig-zag kiln.",
            benefit: "Ensures complete vitrification (glass-like bonding) of clay particles, making it sound-proof and weather-proof."
        },
        sound_insulation: {
            value: "45 dB reduction",
            benefit: "Natural clay density blocks street noise significantly better than hollow blocks."
        },
        thermal_insulation: {
            benefit: "Keeps interiors 5°C cooler in summer due to thermal lag of natural terracotta."
        }
    },

    product_comparisons: {
        vs_flyash: [
            "Fly ash is cement-based and absorbs heat. Clay is natural and breathable.",
            "Fly ash looks dull gray and needs painting. Urban Clay acts as a visible facade element (Exposed Brick).",
            "Fly ash strength degrades over 20 years. Fired clay lasts centuries (like Roman ruins)."
        ],
        vs_local_handmade: [
            "Local bricks are uneven (size varies by 10mm). Urban Clay is machine-extruded with <1mm tolerance.",
            "Local bricks are soft and breakable. Ours 'ring' like a bell when struck (metallic sound test).",
            "Local bricks need plastering. Ours are designed to be exposed."
        ],
        vs_aac_blocks: [
            "AAC blocks crack easily at joints. Clay bricks have better bonding with mortar.",
            "AAC holds moisture and causes paint peeling. Vitrified clay is moisture-resistant."
        ]
    },

    faqs: {
        "efflorescence": "Our low water absorption (<6%) virtually eliminates efflorescence (shora). Local bricks are sponges for salts.",
        "maintenance": "Zero maintenance. No painting, no plastering. Just pressure wash every 5 years if needed.",
        "cost": "While our upfront cost is higher per brick, you save ₹40/sq.ft on plastering and painting. Plus, zero maintenance cost for life.",
        "delivery": "We dispatch directly from the kiln to site to minimize breakage. Transit breakage >3% is refunded.",
        "joints": "We recommend a 8mm-10mm recessed joint using high-grade mortar mixed with waterproofing compound."
    },

    sales_scripts: {
        intro_architect: "We specialize in High-Density Wirecut Bricks (35MPa) for exposed elevations. Unlike local handmade options, ours are machine-extruded for perfect geometry and fired at 1100°C.",
        intro_homeowner: "Building your dream home? Our exposed bricks keep your house cooler, sound-proof, and maintenance-free for generations. It's a one-time investment for a legacy look.",
        objection_price: "I understand the price difference. However, a local brick at ₹8 requires ₹25/sq.ft of plaster and paint every 5 years. Our brick at ₹20 is a finished wall. The lifetime cost of Urban Clay is actually 40% lower.",
        closing_urgent: "We have a firing batch clearing the kiln tomorrow. If you confirm the order today, I can tag your pallets for direct dispatch to avoid the waiting list."
    }
};

export type BrickTopic = keyof typeof BRICK_EXPERTISE;
