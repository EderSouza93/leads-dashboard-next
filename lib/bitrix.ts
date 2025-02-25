import { leadSchema, Lead } from "@/types/leadSchema";
import { addHours, format, parseISO, subDays, subHours } from "date-fns";

export const RUSSIA_UTC_OFFSET = 3;

export function getRussiaDate(targetDate?: string): string {
  const baseData = targetDate ? parseISO(targetDate) : new Date();
  const russiaDate = addHours(baseData, RUSSIA_UTC_OFFSET);
  const russiaHour = russiaDate.getUTCHours();

  if (russiaHour >= 0 && russiaHour < 6) {
    return format(subDays(russiaDate, 1), "yyyy-MM-dd");
  }
  return format(russiaDate, "yyyy-MM-dd");
}
/**
 * Function to search leads from Bitrix via method GET with params in URL
 * @param webhookUrl Webhook URL for Bitrix24 API
 * @param filters Filter parameters
 * @return Array of leads
 */
export async function getLeads(
  webhookUrl: string,
  filters: Record<string, string> = {}
) {
  try {
    let allLeads: Lead[] = [];
    let start = 0;
    const pageSize = 50;

    while (true) {
      const params = new URLSearchParams({
        "order[STATUS_ID]": "ASC",
        "filter[SOURCE_ID]": "WEBFORM",
        "filter[CREATED_BY_ID]": "30",
        "filter[CATEGORY_ID]": "2",
        start: start.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            `filter[${key}]`,
            value,
          ])
        ),
      });

      const response = await fetch(
        `${webhookUrl}crm.deal.list?${params.toString()}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!data.result || !Array.isArray(data.result)) {
        throw new Error("Invalid response from Bitrix24");
      }

      // Validation with zod
      const leads = data.result
        .map((lead: unknown) => {
          try {
            return leadSchema.parse(lead);
          } catch (e) {
            console.error("Failed to parse lead:", e);
            return null;
          }
        })
        .filter(Boolean) as Lead[];

      allLeads.push(...leads);

      // if there not more lead, exit loop
      if (data.result.length < pageSize) break;

      start += pageSize;
    }

    return allLeads;
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    throw error;
  }
}

/**
 * Function to search for leads by local day, compensating for time zone differences
 * @param webhookUrl Webhook URL for Bitrix24 API
 * @param localDate Local date in YYYY-MM-DD format (optional, uses current date if not specified)
 * @returns Array of leads filtered bv local day
 */
export async function getLeadsByLocalDate(
  webhookUrl: string,
  localDate?: string
): Promise<Lead[]> {
  const targetRussiaDate = getRussiaDate(localDate);

  const leads = await getLeads(webhookUrl, { BEGINDATE: targetRussiaDate });

  return leads;
}
