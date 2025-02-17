import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/bitrix';

const WEBHOOK_URL = process.env.BITRIX_WEBHOOK!;

export async function GET() {
    try{
        const leads = await getLeads(WEBHOOK_URL, { "BEGINDATE": "2025-02-16" });
        return NextResponse.json(leads);
    } catch (error) {
        return NextResponse.json({ error: "Erro ao buscar leads" }, { status:500 });
    }
}