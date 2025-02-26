import prisma from "@/lib/prisma";
import { Lead } from "@/types/leadSchema";
import { parseISO, subHours, formatISO } from "date-fns";
import { RUSSIA_UTC_OFFSET } from "@/lib/bitrix";

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
    const result = await prisma.$transaction(
      leadsToSave.map((leadData) =>
        prisma.lead.upsert({
          where: { bitrixId: leadData.bitrixId },
          update: leadData,
          create: leadData,
        })
      )
    );
    return result.length;
  } catch (error) {
    console.error("Erro ao salvar leads no banco de dados:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
