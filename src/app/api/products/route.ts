import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const products = await prisma.product.findMany({});
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
