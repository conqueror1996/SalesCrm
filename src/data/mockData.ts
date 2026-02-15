export interface Product {
    id: string;
    name: string;
    category: 'brick' | 'tile' | 'paver' | 'jali' | 'cladding' | 'roofing' | 'project';
    image: string;
    purchaseRate: number; // Our cost per piece
    sellingRate: number; // Base Selling Price per piece
    pcsPerSqFt: number; // How many units cover 1 sqft
    description?: string;
    dimensions?: string;
}

export interface Message {
    id: string;
    sender: 'client' | 'salesrep' | 'system';
    content: string;
    timestamp: string;
    type: 'text' | 'image' | 'estimate' | 'alert';
    mediaUrl?: string;
}

export interface Lead {
    id: string;
    name: string;
    phone?: string;
    product?: string;
    status: 'new' | 'follow_up' | 'closed' | 'lost' | 'archived' | 'dead';
    lastMessage: Message;
    messages: Message[];
    tags: string[];
    unread: boolean; // New: For Smart Inbox
    dealValue: number; // New: For sorting high value
    lastActive: string; // ISO Date for sorting
    sampleRequest?: {
        status: 'pending' | 'dispatched' | 'delivered';
        items: string;
        requestDate?: string;
    };
    clientProfiler?: {
        responsiveness: 'Fast' | 'Normal' | 'Slow';
        tone: 'Professional' | 'Casual' | 'Urgent';
        seriousnessScore: 'High' | 'Medium' | 'Low';
    };
    // New Qualification Data
    siteLocation?: string;
    projectType?: 'villa' | 'renovation' | 'boundary' | 'commercial';
    estimatedArea?: number;
    workStartDate?: string;
    qualificationStatus?: 'pending' | 'partially_qualified' | 'qualified';
    guidance?: any; // AIGuidance type (avoiding circular dependency)
}

export const PRODUCTS: Product[] = [
    // --- Exposed Bricks (Real Data) ---
    {
        id: 'b1',
        name: 'Exposed Wire Cut Brick',
        category: 'brick',
        image: 'https://5.imimg.com/data5/SELLER/Default/2022/11/QG/DQ/FW/159332258/exposed-wire-cut-brick-500x500.jpeg',
        purchaseRate: 14,
        sellingRate: 20,
        pcsPerSqFt: 5,
        description: 'High-strength wire cut brick with low water absorption (<12%). Fired at 1200°C.',
        dimensions: '230 x 110 x 70 mm'
    },
    {
        id: 'b2',
        name: 'Perforated 10-Hole Brick',
        category: 'brick',
        image: 'https://placehold.co/600x400/A0522D/FFFFFF?text=10-Hole+Brick',
        purchaseRate: 16,
        sellingRate: 24,
        pcsPerSqFt: 5,
        description: 'Hydraulic pressed 10-hole brick for superior thermal insulation and strength.',
        dimensions: '230 x 110 x 70 mm'
    },
    {
        id: 'b3',
        name: 'Handmade Face Brick',
        category: 'brick',
        image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Handmade+Face+Brick',
        purchaseRate: 18,
        sellingRate: 28,
        pcsPerSqFt: 5,
        description: 'Rustic handmade texture for premium elevations. Natural clay colors.'
    },

    // --- Cladding Tiles (Real Data) ---
    {
        id: 'c1',
        name: 'Terracotta Wall Cladding Tile',
        category: 'cladding',
        image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Terracotta+Cladding',
        purchaseRate: 18, // Buying at ~18
        sellingRate: 27, // Selling at ~27 (approx 145/sqft at 5.33 pcs/sqft)
        pcsPerSqFt: 5.33,
        description: '9x3 inch clay tiles for wall elevation. (Approx ₹145/sqft).',
        dimensions: '9 x 3 inches'
    },
    {
        id: 'c2',
        name: 'Antique Brass Fusion Tile',
        category: 'cladding',
        image: 'https://placehold.co/600x400/B8860B/FFFFFF?text=Antique+Brass+Fusion',
        purchaseRate: 28,
        sellingRate: 42, // Approx ₹220/sqft
        pcsPerSqFt: 5.33,
        description: 'Premium cladding with luxury metallic finish. (Approx ₹220/sqft).'
    },

    // --- Jalis (Breeze Blocks) ---
    {
        id: 'j1',
        name: 'Square Petals Jali',
        category: 'jali',
        image: 'https://placehold.co/600x400/808080/FFFFFF?text=Square+Petals+Jali',
        purchaseRate: 40,
        sellingRate: 60,
        pcsPerSqFt: 2.25, // 8x8 inch jali occupies ~0.44 sqft, so ~2.25 pcs/sqft
        description: 'Natural clay jali for ventilation and partition walls.'
    },
    {
        id: 'j2',
        name: 'Geometric Clay Jali',
        category: 'jali',
        image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Geometric+Jali',
        purchaseRate: 70,
        sellingRate: 110,
        pcsPerSqFt: 2.25,
        description: 'Modern geometric design breeze block.'
    },

    // --- Roofing & Flooring ---
    {
        id: 'r1',
        name: 'Mangalore Roof Tile (Premium)',
        category: 'roofing',
        image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Mangalore+Roof',
        purchaseRate: 38,
        sellingRate: 55,
        pcsPerSqFt: 1.5, // Large tiles
        description: 'Classic clay roof tile with high water resistance.'
    },
    {
        id: 'f1',
        name: 'Hexagon Terracotta Floor Tile',
        category: 'paver',
        image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Hexagon+Floor',
        purchaseRate: 40,
        sellingRate: 65,
        pcsPerSqFt: 3.5,
        description: 'Elegant hexagonal flooring for interiors and courtyards.'
    },

    // --- Projects ---
    { id: 'proj1', name: 'Villa Elevation - Hyderabad', category: 'project', image: 'https://placehold.co/600x400/2F4F4F/FFFFFF?text=Villa+Project', purchaseRate: 0, sellingRate: 0, pcsPerSqFt: 0 },
    { id: 'proj2', name: 'Commercial Facade - Blr', category: 'project', image: 'https://placehold.co/600x400/708090/FFFFFF?text=Commercial+Project', purchaseRate: 0, sellingRate: 0, pcsPerSqFt: 0 },
    { id: 'proj3', name: 'Farmhouse Design', category: 'project', image: 'https://placehold.co/600x400/556B2F/FFFFFF?text=Farmhouse', purchaseRate: 0, sellingRate: 0, pcsPerSqFt: 0 },
];

export const INITIAL_LEADS: Lead[] = [];
