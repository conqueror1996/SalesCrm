
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeads() {
    const counts = await prisma.lead.groupBy({
        by: ['source'],
        _count: {
            id: true
        }
    });
    console.log("Lead counts by source:", JSON.stringify(counts, null, 2));

    const latestLeads = await prisma.lead.findMany({
        orderBy: { receivedAt: 'desc' }
    });
    console.log("Latest leads:", JSON.stringify(latestLeads, null, 2));
}

checkLeads().finally(() => prisma.$disconnect());
