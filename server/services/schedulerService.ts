import { storage } from "../storage";
import { searchIdealista } from "../lib/idealista";
import { searchOLX } from "../lib/olx";
import type { Lead, AutomationSettings } from "../../shared/schema";

const SCHEDULER_INTERVAL = 60000;
let schedulerRunning = false;

export function startScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;

  console.log("Scheduler started");

  setInterval(async () => {
    try {
      await runSearches();
    } catch (error) {
      console.error("Scheduler error:", error);
    }
  }, SCHEDULER_INTERVAL);
}

async function runSearches() {
  const allSettings = await storage.getAllAutomationSettings();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentMinute !== 0) return;

  for (const settings of allSettings) {
    if (!settings.enabled) continue;
    if (!settings.searchEnabled) continue;

    const schedule = settings.searchSchedule || "daily";

    const shouldRun =
      (schedule === "daily" && currentHour === 9) ||
      (schedule === "twice_daily" && (currentHour === 9 || currentHour === 15)) ||
      (schedule === "weekly" && now.getDay() === 1 && currentHour === 9);

    if (!shouldRun) continue;

    console.log(`Running search for ${settings.customerId}`);

    const locations = settings.searchLocations || ["Lisboa"];
    const propertyTypes = settings.searchPropertyTypes || ["Apartamento"];
    const priceMin = settings.searchPriceMin || 100000;
    const priceMax = settings.searchPriceMax || 500000;

    const listings: any[] = [];

    for (const location of locations) {
      for (const propertyType of propertyTypes) {

        try {
          const idealista = await searchIdealista({
            location,
            propertyType: propertyType.toLowerCase(),
            operation: "sale",
            minPrice: priceMin,
            maxPrice: priceMax,
          });

          listings.push(...idealista.map(l => ({ ...l, source: "Idealista" })));

        } catch (err) {
          console.error("Idealista error:", err);
        }

        try {
          const olx = await searchOLX({
            location,
            propertyType,
            minPrice: priceMin,
            maxPrice: priceMax,
          });

          listings.push(...olx.map(l => ({ ...l, source: "OLX" })));

        } catch (err) {
          console.error("OLX error:", err);
        }
      }
    }

    if (!listings.length) continue;

    const existingLeads = await storage.getLeadsByCustomer(settings.customerId);
    const existingContacts = new Set(
      existingLeads.map(l => `${l.contact}-${l.email}`)
    );

    let created = 0;

    for (const listing of listings) {

      const key = `${listing.contact}-${listing.email}`;
      if (existingContacts.has(key)) continue;

      await storage.createLead({
        name: listing.name || "Sem nome",
        property: listing.property || "",
        propertyType: listing.propertyType || "",
        location: listing.location || "",
        price: listing.price || "",
        contact: listing.contact || "",
        email: listing.email || undefined,
        source: listing.source || "manual",
        customerId: settings.customerId,
        aiScore: 50,
        aiReasoning: "IA desativada.",
        status: "morno",
        qualification: "pendente_visita",
      });

      existingContacts.add(key);
      created++;
    }

    console.log(`${created} leads criados para ${settings.customerId}`);
  }
}