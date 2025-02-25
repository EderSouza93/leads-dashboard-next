import { NextResponse } from "next/server";
import { syncCurrent, syncLeadsRange } from "@/services/leadSyncService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fullSync = searchParams.get("full") === "true";

  try {
    if (fullSync) {
      try {
        const rangeLeads = await syncLeadsRange(15);

        return NextResponse.json({
          message: "Full Sync completed ",
          data: rangeLeads,
          success: true,
        });
      } catch (syncError) {
        console.error("Error in syncLeadsRange:", syncError);

        return NextResponse.json({
          message: "Full Sync partially completed with errors",
          error: (syncError as Error).message,
          data: [],
          success: false,
        });
      }
    } else {
      const result = await syncCurrent();
      return NextResponse.json({
        message: "Current day sync completed",
        data: result,
        success: true,
      });
    }
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
