import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request:Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

        const leadCount = await prisma.lead.count({
            where: {
                localDate: date,
            },
        });

        return NextResponse.json({
            success: true,
            date,
            count: leadCount,
        });
    } catch (error) {
        console.error('Erro ao buscar leads do banco de dados:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar leads do banco de dados:', details: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}