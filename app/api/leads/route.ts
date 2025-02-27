import { NextResponse } from "next/server";
import { getLeadsByLocalDate } from "@/lib/bitrix";
import { saveLeadsToDatabase } from "@/services/leadService";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export const WEBHOOK_URL = process.env.BITRIX_WEBHOOK!;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

    const leads = await getLeadsByLocalDate(WEBHOOK_URL, date);
    await saveLeadsToDatabase(leads);

    await prisma.syncLog.create({
      data: {
        timestamp: new Date(),
      },
    });

    console.log(`Leads buscados para ${date}: ${leads.length}`);

    return NextResponse.json({
      success: true,
      date,
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leads", details: (error as Error).message },
      { status: 500 }
    );
  }
}
