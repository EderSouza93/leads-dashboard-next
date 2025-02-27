import prisma from "@/lib/prisma";
import { Lead } from "@/types/leadSchema";
import { parseISO, subHours, formatISO } from "date-fns";
import { RUSSIA_UTC_OFFSET } from "@/lib/bitrix";
import { resolve } from "path";

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = 100 * Math.pow(2, attempt);
      console.warn(
        `Attempt ${attempt + 1} failed, trying again after ${delay}ms....`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Maximum retries reached");
}

export async function saveLeadsToDatabase(leads: Lead[]): Promise<number> {
  if (!leads.length) return 0;

  const leadsToSave = leads.map((lead) => {
    const createdAtUTC = parseISO(lead.DATE_CREATE);
    const createdAt = subHours(createdAtUTC, RUSSIA_UTC_OFFSET);
    const createAtISO = formatISO(createdAt);

    return {
      bitrixId: lead.ID,
      title: lead.TITLE,
      sourceId: lead.SOURCE_ID,
      assignedById: lead.ASSIGNED_BY_ID,
      stageId: lead.STAGE_ID,
      createdAt: createAtISO,
      rawData: JSON.stringify(lead),
    };
  });

  try {
    console.log(
      "Trying save leads in the database:",
      leadsToSave.length,
      "leads"
    );
    const result = await withRetry(() =>
      prisma.$transaction(
        leadsToSave.map((leadData) =>
          prisma.lead.upsert({
            where: { bitrixId: leadData.bitrixId },
            update: leadData,
            create: leadData,
          })
        )
      )
    );

    const bitrixId = leadsToSave.map((lead) => lead.bitrixId);
    const savedLeads = await prisma.lead.findMany({
      where: { bitrixId: { in: bitrixId } },
      select: { bitrixId: true },
    });

    const savedCount = savedLeads.length;
    if (savedCount !== leadsToSave.length) {
      console.warn(
        `Inconsistency detected: Expected ${leadsToSave.length} leads, found ${savedCount}`
      );
    } else {
      console.log("Leads saved and validated successfully:", savedCount);
    }
    return savedCount;
  } catch (error) {
    console.error("Error saving leads to database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
