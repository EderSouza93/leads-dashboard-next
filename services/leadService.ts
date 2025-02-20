import { Lead } from "@/types/leadSchema";
import { adjustDateFromRussia } from "@/lib/bitrix";
import { format } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DailyLeadsStats {
    date: string;
    count: number;
    assignedCount: Record<string, number>;
}

/**
 * Saves leads to the database, associanting them with the correct local date
 * @param leads Array of leads of Bitrix
 * @returns Number saved leads
 */
export async function saveLeadsToDatabase(leads: Lead[]): Promise<number> {
    if (!leads.length) return 0;

    const leadsToSave = leads.map(lead => {
        const localCreationDate = adjustDateFromRussia(lead.DATE_CREATE);
        const localDate = format(localCreationDate, 'yyyy-MM-dd');

        return {
            bitrixId: lead.ID,
            title: lead.TITLE,
            sourceId: lead.SOURCE_ID ?? "",
            assignedById: lead.ASSIGNED_BY_ID,
            stageId: lead.STAGE_ID,
            bitrixCreatedAt: new Date(lead.DATE_CREATE),
            localCreatedAt: localCreationDate,
            localDate: localDate,
            rawData: JSON.stringify(lead)
        };
    });

    try {
        const result = await prisma.$transaction(
            leadsToSave.map(leadData => 
                prisma.lead.upsert({
                    where: { bitrixId: leadData.bitrixId },
                    update: leadData,
                    create: leadData
                })
            )
        );

        return result.length
    } catch (error) {
        console.error("Erro ao salvar leads no banco de dados:", error);
        throw error;
    }
}