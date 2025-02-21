import { leadSchema, Lead } from "@/types/leadSchema";
import { format, parseISO, subHours } from "date-fns";

/**
 * Constant for Russia time zone offset (UTC+3)
 */
const RUSSIA_UTC_OFFSET = 3 

/**
 * Adjust date from Russian time to local time
 * @param dateStr String of date in ISO format 
 * @returns Date adjusted to local time zone  
 */
export function adjustDateFromRussia(dateStr: string): Date {
  const date = parseISO(dateStr);
  return subHours(date, RUSSIA_UTC_OFFSET)
}

/**
 * Get the dates needed to fetch leads considering the time zone difference
 * @param targetDate Target date in YYYY-MM-DD format 
 * @returns Object with the previous target and date
 */
export function getDateRangeForTimezoneCompensation(targetDate?: string):{
  targetDate: string;
  previousDate: string;
} {
  // if no date is given use the current date 
  const baseDate = targetDate ? parseISO(targetDate): new Date();
  const formattedTargetDate = format(baseDate, 'yyyy-MM-dd');

  // Gets the previous day to compensate for time difference
  const previousDay = subHours(baseDate, 24);
  const formattedPreviousDate = format(previousDay, 'yyyy-MM-dd');

  return {
    targetDate: formattedTargetDate,
    previousDate: formattedPreviousDate
  };
}

/**
 * Function to search leads from Bitrix via method GET with params in URL 
 * @param webhookUrl Webhook URL for Bitrix24 API
 * @param filters Filter parameters
 * @return Array of leads 
 */
export async function getLeads(webhookUrl: string, filters: Record<string, string> = {}) {
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
        "start": start.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value])
        ),
      });

      const response = await fetch(`${webhookUrl}crm.deal.list?${params.toString()}`, {
        method: "GET"
      });

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
            return null
          }
        })
        .filter(Boolean) as Lead[];

      allLeads.push(...leads);

      // if there not more lead, exit loop
      if(data.result.length < pageSize) break;

      start += pageSize;
    }

    return allLeads
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
export async function getLeadsByLocalDate(webhookUrl: string, localDate?: string): Promise<Lead[]> {
  const { targetDate, previousDate } = getDateRangeForTimezoneCompensation(localDate);
  const localDateString = localDate || format(new Date(), 'yyyy-MM-dd');

  const [targetDayLeads, previousDayLeads] = await Promise.all([
    getLeads(webhookUrl, { "BEGINDATE": targetDate }),
    getLeads(webhookUrl, { "BEGINDATE": previousDate })
  ]);

  const allLeads = [...targetDayLeads, ...previousDayLeads];
  
  const targetLocalDate = parseISO(localDateString);
  const previousLocalDate = subHours(targetLocalDate, 24);
  const previousLocalDateString = format(previousLocalDate, 'yyyy-MM-dd');

  const filteredLeads = allLeads.map(lead => {
    if (!lead.DATE_CREATE) return false;

    const russiaCreationDate = parseISO(lead.DATE_CREATE);
    const russiaHour = russiaCreationDate.getUTCHours() + RUSSIA_UTC_OFFSET;
    const localCreationDate = adjustDateFromRussia(lead.DATE_CREATE);
    const leadLocalDate = format(localCreationDate, 'yyyy-MM-dd');
    
    

    if (russiaHour >= 0 && russiaHour < 6) {
      return {
        ...lead,
        localAdjustedDate: previousLocalDateString,
      }
    }

    if (russiaHour >= 6 && leadLocalDate === localDateString ) {
      return lead;
    }
    return null
  }).filter(Boolean) as Lead[];

  return filteredLeads
}