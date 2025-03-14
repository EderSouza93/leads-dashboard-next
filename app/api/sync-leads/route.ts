import { NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { WEBHOOK_URL } from "../leads/route";
import { getLeadsByLocalDate } from "@/lib/bitrix";
import { saveLeadsToDatabase } from "@/services/leadService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fullSync = searchParams.get("full") === "true";
    const daysToFetch = fullSync ? 5 : 1;

    const today = new Date();
    const leadsByDate: { [date: string]: number } = {};

    const dates = Array.from({ length: daysToFetch }, (_, i) =>
    format(subDays(today, i), "yyyy-MM-dd")
    );
    const leadsPromises = dates.map(async (date) => {
      const leads = await getLeadsByLocalDate(WEBHOOK_URL, date);
      const savedCount = await saveLeadsToDatabase(leads);
      return { date, savedCount };
    });
    const results = await Promise.all(leadsPromises);
    results.forEach(({ date, savedCount }) => {
    leadsByDate[date] = savedCount;
  });

    return NextResponse.json({
      message: fullSync ? "Full sync completed" : "Current day sync completed",
      leadsByDate,
    });
  } catch (error) {
    console.error("Error in the sync:", error);
    return NextResponse.json(
      {
        error: "Error synchronizing leads",
        deatails: (error as Error).message,
        success: false,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
