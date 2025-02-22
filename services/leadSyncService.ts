import { format, subDays } from 'date-fns';
import { saveLeadsToDatabase } from './leadService';
import { getLeadsByLocalDate } from '@/lib/bitrix';

const WEBHOOK_URL = process.env.BITRIX_WEBHOOK || '';

export async function syncLeadsForDays(date: string): Promise<number> {
    if (!WEBHOOK_URL) {
        throw new Error('Environment variable is not defined')
    }

    try {
        console.log(`Searching leads to ${date}...`);
        const leads = await getLeadsByLocalDate(WEBHOOK_URL, date);
        const savedCount = await saveLeadsToDatabase(leads);
        console.log(`Leads saved to ${date}: ${savedCount}`);
        return savedCount;
    } catch (error) {
        console.error(`Failed to sync ${date}:`, error);
        throw error;
    }
}

export async function syncLeadsRange(daysToFetch: number): Promise<void> {
    const today = new Date();

    for (let i = 0; i < daysToFetch; i++) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        await syncLeadsForDays(date);
    }
}

export async function syncCurrent(): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    await syncLeadsForDays(today);
}