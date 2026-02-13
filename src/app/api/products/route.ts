import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MOCK_PRODUCTS = [
    { name: 'Red Slit Smooth', category: 'brick', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Red+Slit+Smooth', purchaseRate: 18, sellingRate: 24, description: 'Smooth finish red terracotta brick' },
    { name: 'Deep Umber Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/5C4033/FFFFFF?text=Deep+Umber', purchaseRate: 20, sellingRate: 28 },
    { name: 'Deep Red Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/8B0000/FFFFFF?text=Deep+Red', purchaseRate: 22, sellingRate: 30 },
    { name: 'Brown Clay Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/A52A2A/FFFFFF?text=Brown+Clay', purchaseRate: 19, sellingRate: 26 },
    { name: 'Sandblast Face Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Sandblast+Face', purchaseRate: 25, sellingRate: 35 },
    { name: 'Sandstone Cream Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/F5DEB3/000000?text=Sandstone+Cream', purchaseRate: 28, sellingRate: 38 },
    { name: 'Textured Sandblast Red', category: 'brick', image: 'https://placehold.co/600x400/CD5C5C/FFFFFF?text=Textured+Red', purchaseRate: 24, sellingRate: 32 },
    { name: 'Woodbark Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Woodbark', purchaseRate: 30, sellingRate: 40 },
    { name: 'Light Grey Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/D3D3D3/000000?text=Light+Grey', purchaseRate: 32, sellingRate: 42 },
    { name: 'Teracotta Basic Red', category: 'brick', image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Basic+Red', purchaseRate: 16, sellingRate: 22 },
    { name: 'Classic Rustic Red', category: 'brick', image: 'https://placehold.co/600x400/800000/FFFFFF?text=Rustic+Red', purchaseRate: 26, sellingRate: 36 },
    { name: 'Charcoal Blend Brick Tile', category: 'brick', image: 'https://placehold.co/600x400/36454F/FFFFFF?text=Charcoal+Blend', purchaseRate: 40, sellingRate: 55 },
    { name: 'Hydraulic Pressed - 10 Holes', category: 'cladding', image: 'https://placehold.co/600x400/A0522D/FFFFFF?text=Hydraulic+10Holes', purchaseRate: 15, sellingRate: 20 },
    { name: 'Clay Extruded AirBrick 2', category: 'cladding', image: 'https://placehold.co/600x400/CD853F/FFFFFF?text=AirBrick+2', purchaseRate: 25, sellingRate: 35 },
    { name: 'Classic Extruded Clay Brick', category: 'cladding', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Classic+Extruded', purchaseRate: 18, sellingRate: 24 },
    { name: 'Mangalore Roof Tile', category: 'roofing', image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Mangalore+Roof', purchaseRate: 35, sellingRate: 45 },
    { name: 'Mangalore Roof Tile (Penta)', category: 'roofing', image: 'https://placehold.co/600x400/8B0000/FFFFFF?text=Mangalore+Penta', purchaseRate: 38, sellingRate: 48 },
    { name: 'Clay Roofing Tile', category: 'roofing', image: 'https://placehold.co/600x400/A52A2A/FFFFFF?text=Clay+Roofing', purchaseRate: 30, sellingRate: 40 },
    { name: 'Teracotta Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Teracotta+Floor', purchaseRate: 40, sellingRate: 55 },
    { name: 'Yellow Clay Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Yellow+Floor', purchaseRate: 45, sellingRate: 60 },
    { name: 'Biege Clay Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/F5F5DC/000000?text=Biege+Floor', purchaseRate: 42, sellingRate: 58 },
    { name: 'Brown Clay Floor Tile', category: 'paver', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Brown+Floor', purchaseRate: 40, sellingRate: 55 },
    { name: 'Yellow Clay Hexagon', category: 'paver', image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Yellow+Hex', purchaseRate: 50, sellingRate: 70 },
    { name: 'Clay Hexagonal Red', category: 'paver', image: 'https://placehold.co/600x400/B22222/FFFFFF?text=Red+Hex', purchaseRate: 48, sellingRate: 68 },
    { name: 'Clay Amber Jaali', category: 'jali', image: 'https://placehold.co/600x400/DEB887/000000?text=Amber+Jaali', purchaseRate: 120, sellingRate: 180 },
    { name: 'Clay Camp Jaali', category: 'jali', image: 'https://placehold.co/600x400/D2691E/FFFFFF?text=Camp+Jaali', purchaseRate: 110, sellingRate: 160 },
    { name: 'Clay Cross Jaali', category: 'jali', image: 'https://placehold.co/600x400/8B4513/FFFFFF?text=Cross+Jaali', purchaseRate: 115, sellingRate: 170 },
    { name: 'Clay Edan Jaly', category: 'jali', image: 'https://placehold.co/600x400/CD853F/FFFFFF?text=Edan+Jaly', purchaseRate: 125, sellingRate: 185 },
    { name: 'Clay Star Jaali', category: 'jali', image: 'https://placehold.co/600x400/DAA520/FFFFFF?text=Star+Jaali', purchaseRate: 130, sellingRate: 190 },
    { name: 'Orco Clay Jaali', category: 'jali', image: 'https://placehold.co/600x400/A0522D/FFFFFF?text=Orco+Jaali', purchaseRate: 135, sellingRate: 200 },
    { name: 'Clay Sapphire Jaali', category: 'jali', image: 'https://placehold.co/600x400/4682B4/FFFFFF?text=Sapphire+Jaali', purchaseRate: 140, sellingRate: 210 },
    { name: 'Topaz Jaali', category: 'jali', image: 'https://placehold.co/600x400/FFD700/000000?text=Topaz+Jaali', purchaseRate: 145, sellingRate: 220 },
    { name: 'Window Jaali', category: 'jali', image: 'https://placehold.co/600x400/808080/FFFFFF?text=Window+Jaali', purchaseRate: 100, sellingRate: 150 },
    { name: 'Villa Elevation - Hyderabad', category: 'project', image: 'https://placehold.co/600x400/2F4F4F/FFFFFF?text=Villa+Project', purchaseRate: 0, sellingRate: 0 },
    { name: 'Commercial Facade - Blr', category: 'project', image: 'https://placehold.co/600x400/708090/FFFFFF?text=Commercial+Project', purchaseRate: 0, sellingRate: 0 },
    { name: 'Farmhouse Design', category: 'project', image: 'https://placehold.co/600x400/556B2F/FFFFFF?text=Farmhouse', purchaseRate: 0, sellingRate: 0 },
];

export async function GET() {
    try {
        let products = await prisma.product.findMany({});

        if (products.length === 0) {
            console.log('Seeding products database with mock data...');
            // Need to use for...of loop for async await in sequence or Promise.all
            // Using createMany is not supported in SQLite for some reason in older versions, 
            // but in newer prisma it is. Let's stick to createMany if possible, or loop.
            // SQLite connector does NOT support createMany. We must loop or Promise.all.

            await Promise.all(MOCK_PRODUCTS.map(p => prisma.product.create({ data: p })));

            // Re-fetch
            products = await prisma.product.findMany({});
        }

        return NextResponse.json({ products });
    } catch (error: any) {
        console.error('Error fetching/seeding products:', error);
        return NextResponse.json({ products: [], error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Simple validation
        if (!body.name || !body.sellingRate) {
            return NextResponse.json({ error: 'Name and Selling Rate are required' }, { status: 400 });
        }

        const newProduct = await prisma.product.create({
            data: {
                name: body.name,
                category: body.category || 'brick',
                image: body.image || 'https://placehold.co/600x400/333/FFF?text=Product',
                sellingRate: parseFloat(body.sellingRate),
                purchaseRate: parseFloat(body.purchaseRate || '0'),
                description: body.description || '',
                dimensions: body.dimensions || ''
            }
        });

        return NextResponse.json(newProduct);
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
