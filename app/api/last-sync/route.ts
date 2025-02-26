import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const lastSync = await prisma.syncLog.findFirst({
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      lastSync: lastSync ? lastSync.timestamp.toISOString() : null,
    });
  } catch (error) {
    console.error("Error to search the last sync:", error);
    return NextResponse.json(
      {
        error: "Error to search the last sync:",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = "force-dynamic";
