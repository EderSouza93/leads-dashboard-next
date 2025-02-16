import { z } from "zod";

const leadSchema = z.object({
  ID: z.string(),
  TITLE: z.string(),
  DATE_CREATE: z.string(),
  STATUS_ID: z.string(),
  SOURCE_ID: z.string(),
  ASSIGNED_BY_ID: z.string(),
  NAME: z.string().optional(),
  PHONE: z.array(z.object({
    VALUE: z.string(),
    VALUE_TYPE: z.string()
  })).optional(),
  EMAIL: z.array(z.object({
    VALUE: z.string(),
    VALUE_TYPE: z.string()
  })).optional()
});

export type Lead = z.infer<typeof leadSchema>;

export async function getLeads(webhookUrl: string) {
  try {
    const response = await fetch(`${webhookUrl}/crm.lead.list`);
    const data = await response.json();
    
    if (!data.result) {
      throw new Error("Invalid response from Bitrix24");
    }

    return data.result.map((lead: unknown) => {
      try {
        return leadSchema.parse(lead);
      } catch (e) {
        console.error("Failed to parse lead:", e);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    throw error;
  }
}