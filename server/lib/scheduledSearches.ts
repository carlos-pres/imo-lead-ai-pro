import { storage } from "../storage";
import { searchWithApify, type ApifyProperty } from "./apify";
import { analyzeLeadWithAI } from "./openai";
import type { Lead } from "@shared/schema";

export interface ScheduledSearchConfig {
  enabled: boolean;
  locations: string[];
  propertyTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  sources: ("idealista" | "supercasa" | "imovirtual" | "all")[];
  runTime: string;
  lastRun?: Date;
}

const DEFAULT_SEARCH_CONFIG: ScheduledSearchConfig = {
  enabled: true,
  locations: ["Lisboa", "Porto", "Cascais", "Sintra", "Oeiras"],
  propertyTypes: ["Apartamento", "Moradia"],
  minPrice: 100000,
  maxPrice: 1000000,
  sources: ["all"],
  runTime: "08:00",
};

export async function runScheduledSearchForCustomer(customerId: string): Promise<{
  success: boolean;
  leadsCreated: number;
  error?: string;
}> {
  console.log(`[ScheduledSearch] Running for customer ${customerId}`);

  try {
    const settings = await storage.getAutomationSettings(customerId);
    if (!settings?.searchEnabled) {
      console.log(`[ScheduledSearch] Search disabled for ${customerId}`);
      return { success: true, leadsCreated: 0, error: "Auto search disabled" };
    }

    const existingLeads = await storage.getLeadsByCustomer(customerId);
    const existingUrls = new Set(
      existingLeads
        .filter((l: Lead) => l.sourceUrl)
        .map((l: Lead) => l.sourceUrl)
    );

    let totalCreated = 0;

    for (const location of DEFAULT_SEARCH_CONFIG.locations.slice(0, 3)) {
      for (const propertyType of DEFAULT_SEARCH_CONFIG.propertyTypes.slice(0, 2)) {
        const result = await searchWithApify(
          {
            location,
            propertyType,
            minPrice: DEFAULT_SEARCH_CONFIG.minPrice,
            maxPrice: DEFAULT_SEARCH_CONFIG.maxPrice,
            maxItems: 10,
          },
          "all"
        );

        if (result.listings.length > 0) {
          for (const listing of result.listings) {
            if (listing.url && existingUrls.has(listing.url)) {
              continue;
            }

            const aiAnalysis = await analyzeLeadWithAI({
              name: listing.contactName,
              property: listing.title,
              propertyType: listing.propertyType,
              location: listing.location,
              price: listing.price,
              contact: listing.contact,
              source: listing.source,
            });

            const propertyTypeMap: Record<string, "Apartamento" | "Moradia" | "Terreno" | "Comercial" | "Outro"> = {
              "Apartamento": "Apartamento",
              "Moradia": "Moradia",
              "Terreno": "Terreno",
              "Comercial": "Comercial",
            };

            const sourceMap: Record<string, "Idealista" | "OLX" | "Casafari" | "Manual"> = {
              "Idealista": "Idealista",
              "idealista": "Idealista",
              "Supercasa": "Manual",
              "supercasa": "Manual",
              "Imovirtual": "Manual",
              "imovirtual": "Manual",
            };

            const newLead = await storage.createLead({
              name: listing.contactName,
              property: listing.title,
              propertyType: propertyTypeMap[listing.propertyType] || "Outro",
              location: listing.location,
              price: listing.price,
              status: aiAnalysis.status,
              ownerType: "particular",
              qualification: "pendente_visita",
              source: sourceMap[listing.source] || "Manual",
              sourceUrl: listing.url || undefined,
              contact: listing.contact,
              email: listing.email || undefined,
              aiScore: aiAnalysis.score,
              aiReasoning: aiAnalysis.reasoning,
              notes: listing.description?.substring(0, 500) || undefined,
              optOut: false,
              customerId,
            });

            if (newLead) {
              totalCreated++;
              if (listing.url) {
                existingUrls.add(listing.url);
              }
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`[ScheduledSearch] Created ${totalCreated} leads for ${customerId}`);
    return { success: true, leadsCreated: totalCreated };
  } catch (error: any) {
    console.error(`[ScheduledSearch] Error for ${customerId}:`, error.message);
    return { success: false, leadsCreated: 0, error: error.message };
  }
}

export async function runAllScheduledSearches(): Promise<void> {
  console.log("[ScheduledSearch] Running all scheduled searches...");

  const customers = await storage.getCustomers();
  const proCustomers = customers.filter((c) => 
    c.plan === "pro" || c.plan === "custom" || c.plan === "enterprise"
  );

  console.log(`[ScheduledSearch] Found ${proCustomers.length} Pro/Custom customers`);

  for (const customer of proCustomers) {
    try {
      await runScheduledSearchForCustomer(customer.id);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`[ScheduledSearch] Failed for ${customer.id}:`, error);
    }
  }

  console.log("[ScheduledSearch] All scheduled searches complete");
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let lastRunDate: string | null = null;

export function startScheduler(): void {
  if (schedulerInterval) {
    console.log("[Scheduler] Already running");
    return;
  }

  console.log("[Scheduler] Starting daily search scheduler...");
  
  const today = new Date().toISOString().slice(0, 10);
  const currentHour = new Date().getHours();
  
  if (currentHour >= 8 && lastRunDate !== today) {
    console.log("[Scheduler] Missed today's 08:00 run, executing now...");
    lastRunDate = today;
    runAllScheduledSearches().catch(err => {
      console.error("[Scheduler] Catch-up run failed:", err);
    });
  }

  schedulerInterval = setInterval(async () => {
    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const hour = now.getHours();
    
    if (hour >= 8 && lastRunDate !== todayDate) {
      console.log("[Scheduler] Running daily scheduled searches");
      lastRunDate = todayDate;
      try {
        await runAllScheduledSearches();
      } catch (err) {
        console.error("[Scheduler] Scheduled run failed:", err);
      }
    }
  }, 60000);

  console.log("[Scheduler] Scheduler started - runs daily at 08:00 (with catch-up)");
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}
