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

export const PRODUCTS: Product[] = [];

export const INITIAL_LEADS: Lead[] = [];
