import { leadSchema, Lead } from "@/types/leadSchema";
/**
 * Function to search leads from Bitrix via method GET with params in URL
 * @param webhookUrl 
 * @param filters 
 * @returns 
 */

export async function getLeads(webhookUrl: string, filters: Record<string, string> = {}) {
  try {
    let allLeads: Lead[] = [];
    let start = 0;
    const pageSize = 50

    while (true) {
      const params = new URLSearchParams({
        "order[STATUS_ID": "ASC",
        "filter[!STATUS_ID]": "CONVERTED",
        "start": start.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value])
        ),
      });

      const response = await fetch(`${webhookUrl}/crm.deal.list?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type" : "application/json" },
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
          return null;
        }
      })
      .filter(Boolean) as Lead[];

      allLeads.push(...leads)


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