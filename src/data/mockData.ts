export interface Product {
    id: string;
    name: string;
    category: 'brick' | 'tile' | 'paver' | 'jali' | 'cladding' | 'roofing' | 'project';
    image: string;
    purchaseRate: number; // Our cost
    sellingRate: number; // Base Selling Price
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
    // --- Bricks (Smooth, Textured, Handmade) ---
    { id: 'b1', name: 'Red Slit Smooth', category: 'brick', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Red+Slit+Smooth', purchaseRate: 18, sellingRate: 24, description: 'Smooth finish red terracotta brick' },
    { id: 'b2', name: 'Deep Umber Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/5C4033/FFFFFF?text=Deep+Umber', purchaseRate: 20, sellingRate: 28 },
    { id: 'b3', name: 'Deep Red Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/8B0000/FFFFFF?text=Deep+Red', purchaseRate: 22, sellingRate: 30 },
    { id: 'b4', name: 'Brown Clay Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/A52A2A/FFFFFF?text=Brown+Clay', purchaseRate: 19, sellingRate: 26 },
    { id: 'b5', name: 'Sandblast Face Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Sandblast+Face', purchaseRate: 25, sellingRate: 35 },
    { id: 'b6', name: 'Sandstone Cream Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/F5DEB3/000000?text=Sandstone+Cream', purchaseRate: 28, sellingRate: 38 },
    { id: 'b7', name: 'Textured Sandblast Red', category: 'brick', image: 'https://placehold.co/600x400/CD5C5C/FFFFFF?text=Textured+Red', purchaseRate: 24, sellingRate: 32 },
    { id: 'b8', name: 'Woodbark Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Woodbark', purchaseRate: 30, sellingRate: 40 },
    { id: 'b9', name: 'Light Grey Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/D3D3D3/000000?text=Light+Grey', purchaseRate: 32, sellingRate: 42 },
    { id: 'b10', name: 'Teracotta Basic Red', category: 'brick', image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Basic+Red', purchaseRate: 16, sellingRate: 22 },
    { id: 'b11', name: 'Classic Rustic Red', category: 'brick', image: 'https://placehold.co/600x400/800000/FFFFFF?text=Rustic+Red', purchaseRate: 26, sellingRate: 36 },
    { id: 'b12', name: 'Charcoal Blend Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/36454F/FFFFFF?text=Charcoal+Blend', purchaseRate: 40, sellingRate: 55 },

    // --- Exposed / Cladding ---
    { id: 'c1', name: 'Hydraulic Pressed - 10 Holes', category: 'cladding', image: 'https://placehold.co/600x400/A0522D/FFFFFF?text=Hydraulic+10Holes', purchaseRate: 15, sellingRate: 20 },
    { id: 'c2', name: 'Clay Extruded AirBrick 2', category: 'cladding', image: 'https://placehold.co/600x400/CD853F/FFFFFF?text=AirBrick+2', purchaseRate: 25, sellingRate: 35 },
    { id: 'c3', name: 'Classic Extruded Clay Brick', category: 'cladding', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Classic+Extruded', purchaseRate: 18, sellingRate: 24 },

    // --- Roofing ---
    { id: 'r1', name: 'Mangalore Roof Tile', category: 'roofing', image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Mangalore+Roof', purchaseRate: 35, sellingRate: 45 },
    { id: 'r2', name: 'Mangalore Roof Tile (Penta)', category: 'roofing', image: 'https://placehold.co/600x400/8B0000/FFFFFF?text=Mangalore+Penta', purchaseRate: 38, sellingRate: 48 },
    { id: 'r3', name: 'Clay Roofing Tile', category: 'roofing', image: 'https://placehold.co/600x400/A52A2A/FFFFFF?text=Clay+Roofing', purchaseRate: 30, sellingRate: 40 },

    // --- Flooring (Paver) ---
    { id: 'f1', name: 'Teracotta Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Teracotta+Floor', purchaseRate: 40, sellingRate: 55 },
    { id: 'f2', name: 'Yellow Clay Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Yellow+Floor', purchaseRate: 45, sellingRate: 60 },
    { id: 'f3', name: 'Biege Clay Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/F5F5DC/000000?text=Biege+Floor', purchaseRate: 42, sellingRate: 58 },
    { id: 'f4', name: 'Brown Clay Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Brown+Floor', purchaseRate: 40, sellingRate: 55 },
    { id: 'f5', name: 'Yellow Clay Hexagon', category: 'paver', image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Yellow+Hex', purchaseRate: 50, sellingRate: 70 },
    { id: 'f6', name: 'Clay Hexagonal Red', category: 'paver', image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Red+Hex', purchaseRate: 48, sellingRate: 68 },

    // --- Jalis (Breeze Blocks) ---
    { id: 'j1', name: 'Clay Amber Jaali', category: 'jali', image: 'https://placehold.co/600x400/DEB887/000000?text=Amber+Jaali', purchaseRate: 120, sellingRate: 180 },
    { id: 'j2', name: 'Clay Camp Jaali', category: 'jali', image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Camp+Jaali', purchaseRate: 110, sellingRate: 160 },
    { id: 'j3', name: 'Clay Cross Jaali', category: 'jali', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Cross+Jaali', purchaseRate: 115, sellingRate: 170 },
    { id: 'j4', name: 'Clay Edan Jaly', category: 'jali', image: 'https://placehold.co/600x400/CD853F/FFFFFF?text=Edan+Jaly', purchaseRate: 125, sellingRate: 185 },
    { id: 'j5', name: 'Clay Star Jaali', category: 'jali', image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Star+Jaali', purchaseRate: 130, sellingRate: 190 },
    { id: 'j6', name: 'Orco Clay Jaali', category: 'jali', image: 'https://placehold.co/600x400/A0522D/FFFFFF?text=Orco+Jaali', purchaseRate: 135, sellingRate: 200 },
    { id: 'j7', name: 'Clay Sapphire Jaali', category: 'jali', image: 'https://placehold.co/600x400/4682B4/FFFFFF?text=Sapphire+Jaali', purchaseRate: 140, sellingRate: 210 },
    { id: 'j8', name: 'Topaz Jaali', category: 'jali', image: 'https://placehold.co/600x400/FFD700/000000?text=Topaz+Jaali', purchaseRate: 145, sellingRate: 220 },
    { id: 'j9', name: 'Window Jaali', category: 'jali', image: 'https://placehold.co/600x400/808080/FFFFFF?text=Window+Jaali', purchaseRate: 100, sellingRate: 150 },

    // --- Projects ---
    { id: 'proj1', name: 'Villa Elevation - Hyderabad', category: 'project', image: 'https://placehold.co/600x400/2F4F4F/FFFFFF?text=Villa+Project', purchaseRate: 0, sellingRate: 0 },
    { id: 'proj2', name: 'Commercial Facade - Blr', category: 'project', image: 'https://placehold.co/600x400/708090/FFFFFF?text=Commercial+Project', purchaseRate: 0, sellingRate: 0 },
    { id: 'proj3', name: 'Farmhouse Design', category: 'project', image: 'https://placehold.co/600x400/556B2F/FFFFFF?text=Farmhouse', purchaseRate: 0, sellingRate: 0 },
];

export const INITIAL_LEADS: Lead[] = [];
