import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        console.log('Attempting to connect to database...');
        // Try a simple query
        const count = await prisma.lead.count();
        return NextResponse.json({
            status: 'ok',
            message: 'Database connection successful',
            leadCount: count,
            env: {
                // connection string shouldn't be fully exposed but let's check if it exists
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV
            }
        });
    } catch (error: any) {
        console.error('Database connection failed:', error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        }, { status: 500 });
    }
}
