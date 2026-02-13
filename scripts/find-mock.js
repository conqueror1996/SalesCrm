
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMock() {
    const lead = await prisma.lead.findFirst({
        where: { phone: { contains: '9876543210' } },
        include: { messages: true }
    });
    console.log("Mock Lead Found:", JSON.stringify(lead, null, 2));
}

findMock().finally(() => prisma.$disconnect());
