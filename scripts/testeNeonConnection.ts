import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Conexão com Neon bem-sucedida!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro na conexão com Neon:', error);
  }
}

testConnection().catch(console.error);