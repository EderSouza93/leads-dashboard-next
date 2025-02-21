import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection():Promise<void> {
    try {
        await prisma.$connect();
        console.log('Conexão com Supabase bem-sucedida!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('Erro na conexão com Supabase:', error);
    }
}

testConnection().catch(console.error);