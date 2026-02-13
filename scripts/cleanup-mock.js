
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log("🧹 Cleaning up mock leads...");

    // Find mock lead IDs
    const mockLeads = await prisma.lead.findMany({
        where: {
            OR: [
                { name: 'Rahul Sharma', source: 'IndiaMART API' },
                { phone: '919876543210' }
            ]
        },
        select: { id: true }
    });

    const mockIds = mockLeads.map(l => l.id);

    if (mockIds.length > 0) {
        // Delete messages first
        await prisma.message.deleteMany({
            where: { leadId: { in: mockIds } }
        });

        // Then delete leads
        const result = await prisma.lead.deleteMany({
            where: { id: { in: mockIds } }
        });
        console.log(`✅ Removed ${result.count} mock leads and their messages.`);
    } else {
        console.log("ℹ️ No mock leads found to clean up.");
    }
}

cleanup()
    .catch(e => console.error("Error during cleanup:", e))
    .finally(() => prisma.$disconnect());
