const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPromotions() {
  try {
    const deleted = await prisma.promotion.deleteMany({});
    console.log(`Deletadas ${deleted.count} promoções`);
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPromotions();