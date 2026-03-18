const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, rol: true, activo: true }
    });
    console.log('Users in DB:', JSON.stringify(users, null, 2));
    const count = await prisma.user.count();
    console.log('Total users:', count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
