import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { formatISO } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  let date;
  try {
    const { searchParams } = new URL(request.url);
    date =
      searchParams.get("date") ||
      formatISO(new Date(), {
        format: "extended",
        representation: "complete",
      }) + "Z";

    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: new Date(`${date}T00:00:00Z`),
          lt: new Date(`${date}T23:59:59Z`),
        },
      },
      select: {
        createdAt: true,
        bitrixId: true,
        title: true,
        sourceId: true,
        assignedById: true,
        stageId: true,
        rawData: true,
      },
    });

    const count = leads.length;

    const formattedLeads = leads.map((lead) => ({
      ...lead,
      createdAt:
        formatISO(lead.createdAt, {
          format: "extended",
          representation: "complete",
        }) + "Z",
    }));

    return NextResponse.json({
      success: true,
      date,
      count,
      leads: formattedLeads,
    });
  } catch (error) {
    console.error(`Error to search leads to ${date}`, error);
    return NextResponse.json(
      {
        error: "Error to search leads of database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = "force-dynamic";
