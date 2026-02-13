import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Debug DB: Starting diagnostics...');

        // 1. Check Environment Variable
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            return NextResponse.json({
                status: 'error',
                step: 'env_check',
                message: 'DATABASE_URL is missing in environment variables'
            }, { status: 500 });
        }

        // Masked URL for debugging safety
        const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':****@');

        // 2. Dynamic Import of DB Client (to catch initialization errors)
        console.log('Debug DB: Importing Prisma Client...');
        let prisma;
        try {
            const dbModule = await import('@/lib/db');
            prisma = dbModule.prisma;
        } catch (importError: any) {
            return NextResponse.json({
                status: 'error',
                step: 'prisma_init',
                message: 'Failed to initialize Prisma Client',
                details: importError.message,
                stack: importError.stack
            }, { status: 500 });
        }

        // 3. Test Connection
        console.log('Debug DB: Testing connection...');
        const count = await prisma.lead.count();

        return NextResponse.json({
            status: 'ok',
            message: 'Database connection successful',
            leadCount: count,
            connectionString: maskedUrl,
            postgresParams: {
                hasPgbouncer: dbUrl.includes('pgbouncer'),
                sslMode: dbUrl.includes('sslmode')
            }
        });

    } catch (error: any) {
        console.error('Database connection failed:', error);
        return NextResponse.json({
            status: 'error',
            step: 'connection_test',
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        }, { status: 500 });
    }
}
