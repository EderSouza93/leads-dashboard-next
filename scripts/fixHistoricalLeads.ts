import { PrismaClient } from '@prisma/client';
import { parseISO, subHours, format } from 'date-fns';

const prisma = new PrismaClient();
const RUSSIA_UTC_OFFSET = 3;

async function fixHistoricalLeads() {
    try {
        const leads = await prisma.lead.findMany()

        const updatedLeads = leads.map(lead => {
            const russiaCreationDate = parseISO(lead.localCreatedAt.toISOString());
            const russiaHour = russiaCreationDate.getUTCHours() + RUSSIA_UTC_OFFSET;
            let localDate = lead.localDate;

            if (russiaHour >= 0 && russiaHour < 6) {
                const localCreationDate = subHours(russiaCreationDate, RUSSIA_UTC_OFFSET);
                localDate = format(subHours(localCreationDate, 24), 'yyyy-MM-dd');
            }

            return {
                ...lead,
                localDate,
            };
        });

        await prisma.$transaction(
            updatedLeads.map(lead =>
                prisma.lead.update({
                    where: { id: lead.id },
                    data: { localDate: lead.localDate },
                })
            )
        );

        console.log('Dados históricos corrigidos com sucessso!');
    } catch (error) {
        console.error('Erro ao corrigir dados históricos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixHistoricalLeads();