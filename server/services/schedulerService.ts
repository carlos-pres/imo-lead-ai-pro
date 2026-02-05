import { storage } from "../storage";
import { generateAIMessage, sendEmail, sendWhatsApp } from "./emailService";
import { sendWeeklyReportEmail } from "../lib/email";
import { searchCasafari, convertToLead, analyzeListingWithAI, checkDuplicateLead } from "./casafariService";
import { searchIdealista } from "../lib/idealista";
import { searchOLX } from "../lib/olx";
import { getReportsPerWeek, getPlanConfig } from "@shared/plans";
import type { Lead, MessageJob, AutomationSettings, InsertLead } from "@shared/schema";

const SCHEDULER_INTERVAL = 60000; // 1 minute
let schedulerRunning = false;

export function startScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  console.log("Automation scheduler started");
  
  setInterval(async () => {
    try {
      await processMessageJobs();
      await processFollowups();
      await processCasafariSearches();
      await processScheduledReports();
    } catch (error) {
      console.error("Scheduler error:", error);
    }
  }, SCHEDULER_INTERVAL);
}

async function processMessageJobs() {
  const pendingJobs = await storage.getPendingMessageJobs();
  const now = new Date();

  for (const job of pendingJobs) {
    if (new Date(job.scheduledAt) > now) continue;

    const settings = await storage.getAutomationSettings(job.customerId);
    if (!settings?.enabled) {
      await storage.updateMessageJob(job.id, { status: "cancelled" });
      continue;
    }

    if (isQuietHours(settings)) {
      continue;
    }

    try {
      const lead = await storage.getLead(job.leadId);
      if (!lead || lead.optOut) {
        await storage.updateMessageJob(job.id, { status: "cancelled" });
        continue;
      }

      let result: { success: boolean; error?: string; fallbackUrl?: string };

      if (job.channel === "whatsapp" && lead.contact) {
        result = await sendWhatsApp(lead.contact, job.content);
      } else if (job.channel === "email" && lead.email) {
        result = await sendEmail({
          to: lead.email,
          subject: job.subject || `ImoLead - ${lead.location}`,
          body: job.content,
        });
      } else {
        result = { success: false, error: "No valid contact method" };
      }

      if (result.success) {
        await storage.updateMessageJob(job.id, { 
          status: "sent", 
          sentAt: new Date(),
          metadata: result.fallbackUrl ? { fallbackUrl: result.fallbackUrl } : undefined
        });

        await storage.createInteraction({
          leadId: job.leadId,
          type: job.channel as "email" | "whatsapp",
          content: job.content,
          metadata: { 
            automated: true, 
            trigger: job.trigger,
            fallbackUrl: result.fallbackUrl 
          },
        });

        await trackUsage(job.customerId, job.channel === "whatsapp" ? "messages_whatsapp" : "messages_email", 1, "automation");
      } else {
        const attempts = (job.attempts || 0) + 1;
        if (attempts >= 3) {
          await storage.updateMessageJob(job.id, { 
            status: "failed", 
            attempts, 
            lastError: result.error 
          });
        } else {
          await storage.updateMessageJob(job.id, { 
            attempts, 
            lastError: result.error,
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000)
          });
        }
      }
    } catch (error: any) {
      console.error("Message job error:", error);
      await storage.updateMessageJob(job.id, { 
        attempts: (job.attempts || 0) + 1, 
        lastError: error.message 
      });
    }
  }
}

async function processFollowups() {
  const allSettings = await storage.getAllAutomationSettings();
  const now = new Date();

  for (const settings of allSettings) {
    if (!settings.enabled) continue;

    const leads = await storage.getLeadsByCustomer(settings.customerId);
    
    for (const lead of leads) {
      if (lead.optOut) continue;

      const lastInteraction = await storage.getLastInteraction(lead.id);
      if (!lastInteraction) continue;

      const daysSinceContact = Math.floor(
        (now.getTime() - new Date(lastInteraction.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const existingJobs = await storage.getMessageJobsForLead(lead.id);
      const hasPendingJob = existingJobs.some(j => j.status === "pending");
      if (hasPendingJob) continue;

      let trigger: "followup_3d" | "followup_7d" | null = null;
      
      if (settings.autoFollowup3Days && daysSinceContact >= 3 && daysSinceContact < 7) {
        const has3dFollowup = existingJobs.some(j => j.trigger === "followup_3d");
        if (!has3dFollowup) trigger = "followup_3d";
      } else if (settings.autoFollowup7Days && daysSinceContact >= 7) {
        const has7dFollowup = existingJobs.some(j => j.trigger === "followup_7d");
        if (!has7dFollowup) trigger = "followup_7d";
      }

      if (trigger) {
        await scheduleFollowupMessage(settings, lead, trigger);
      }
    }
  }
}

async function scheduleFollowupMessage(
  settings: AutomationSettings, 
  lead: Lead, 
  trigger: "followup_3d" | "followup_7d"
) {
  const channel = settings.preferredChannel as "whatsapp" | "email";
  
  const hasContact = channel === "whatsapp" ? !!lead.contact : !!lead.email;
  if (!hasContact) return;

  const message = await generateAIMessage(
    lead.name,
    lead.location,
    lead.property,
    lead.price,
    trigger,
    channel
  );

  const scheduledAt = getNextSendTime(settings);

  await storage.createMessageJob({
    customerId: settings.customerId,
    leadId: lead.id,
    channel,
    content: message.content,
    subject: message.subject,
    trigger,
    scheduledAt,
  });
}

async function processCasafariSearches() {
  const allSettings = await storage.getAllAutomationSettings();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentMinute !== 0) return;

  for (const settings of allSettings) {
    if (!settings.enabled) continue;
    
    const searchEnabled = settings.searchEnabled ?? settings.casafariEnabled;
    if (!searchEnabled) continue;

    const schedule = settings.searchSchedule || settings.casafariSchedule || "daily";
    const shouldRun = 
      (schedule === "daily" && currentHour === 9) ||
      (schedule === "twice_daily" && (currentHour === 9 || currentHour === 15)) ||
      (schedule === "weekly" && now.getDay() === 1 && currentHour === 9);

    if (!shouldRun) continue;

    console.log(`[Scheduler] Running automated search for customer ${settings.customerId}`);

    const sources = (settings.searchSources as string[]) || ["casafari", "idealista", "olx"];
    const locations = (settings.searchLocations as string[]) || ["Lisboa"];
    const propertyTypes = (settings.searchPropertyTypes as string[]) || ["Apartamento"];
    const priceMin = settings.searchPriceMin || 100000;
    const priceMax = settings.searchPriceMax || 500000;
    const autoClassify = settings.autoClassifyLeads ?? true;
    const minScore = settings.searchMinScore || 40;

    const allListings: any[] = [];

    for (const location of locations) {
      for (const propertyType of propertyTypes) {
        const searchParams = {
          location,
          propertyType,
          priceMin,
          priceMax,
        };

        if (sources.includes("casafari")) {
          const casafariApiKey = process.env.CASAFARI_API_KEY;
          const { listings, error } = await searchCasafari(searchParams, casafariApiKey);
          if (!error) {
            allListings.push(...listings.map(l => ({ ...l, source: "Casafari" })));
            console.log(`[Scheduler] Casafari (${location}/${propertyType}): ${listings.length} listings`);
          } else {
            console.error(`[Scheduler] Casafari error for ${location}:`, error);
          }
        }

        if (sources.includes("idealista")) {
          try {
            const listings = await searchIdealista({
              location,
              propertyType: propertyType.toLowerCase(),
              operation: "sale",
              minPrice: priceMin,
              maxPrice: priceMax,
            });
            allListings.push(...listings.map(l => ({ ...l, source: "Idealista" })));
            console.log(`[Scheduler] Idealista (${location}/${propertyType}): ${listings.length} listings`);
          } catch (error) {
            console.error(`[Scheduler] Idealista error for ${location}:`, error);
          }
        }

        if (sources.includes("olx")) {
          try {
            const listings = await searchOLX({
              location,
              propertyType,
              minPrice: priceMin,
              maxPrice: priceMax,
            });
            allListings.push(...listings.map(l => ({ ...l, source: "OLX" })));
            console.log(`[Scheduler] OLX (${location}/${propertyType}): ${listings.length} listings`);
          } catch (error) {
            console.error(`[Scheduler] OLX error for ${location}:`, error);
          }
        }
      }
    }

    console.log(`[Scheduler] Total listings found: ${allListings.length}`);

    if (allListings.length > 0) {
      await trackUsage(settings.customerId, "leads_captured", allListings.length, "automation");
    }

    const existingLeads = await storage.getLeadsByCustomer(settings.customerId);
    const existingContactInfo = existingLeads.map(l => ({
      contact: l.contact,
      email: l.email || undefined,
      location: l.location,
    }));

    let createdCount = 0;
    let analyzedCount = 0;

    for (const listing of allListings) {
      const isDuplicate = await checkDuplicateLead(listing, existingContactInfo);
      if (isDuplicate) continue;

      let analysis: { score: number; reasoning: string; status: "frio" | "morno" | "quente" } = { 
        score: 50, 
        reasoning: "Sem análise IA", 
        status: "morno"
      };
      
      if (autoClassify) {
        analysis = await analyzeListingWithAI(listing);
        analyzedCount++;
        
        if (analysis.score < minScore) {
          console.log(`[Scheduler] Lead filtrado: score ${analysis.score} < ${minScore}`);
          continue;
        }
      }

      const leadData = convertToLead(listing);
      const newLead = await storage.createLead({
        ...leadData,
        customerId: settings.customerId,
        aiScore: analysis.score,
        aiReasoning: analysis.reasoning,
        status: analysis.status,
        qualification: "pendente_visita",
      } as InsertLead & { customerId?: string });

      createdCount++;

      existingContactInfo.push({
        contact: newLead.contact,
        email: newLead.email || undefined,
        location: newLead.location,
      });

      await storage.createInteraction({
        leadId: newLead.id,
        type: "note",
        content: `Lead descoberto automaticamente via ${listing.source}. Score: ${analysis.score}. ${analysis.reasoning}`,
        metadata: { automated: true, source: listing.source.toLowerCase() },
      });

      if (settings.autoContactNewLeads && settings.autoMessageNewLead) {
        await scheduleNewLeadMessage(settings, newLead);
      }
    }

    if (analyzedCount > 0) {
      await trackUsage(settings.customerId, "leads_analyzed", analyzedCount, "automation");
    }

    console.log(`[Scheduler] Customer ${settings.customerId}: ${createdCount} leads criados, ${analyzedCount} analisados`);
  }
}

async function scheduleNewLeadMessage(settings: AutomationSettings, lead: Lead) {
  const channel = settings.preferredChannel as "whatsapp" | "email";
  const hasContact = channel === "whatsapp" ? !!lead.contact : !!lead.email;
  if (!hasContact) return;

  const message = await generateAIMessage(
    lead.name,
    lead.location,
    lead.property,
    lead.price,
    "new_lead",
    channel
  );

  const scheduledAt = getNextSendTime(settings);

  await storage.createMessageJob({
    customerId: settings.customerId,
    leadId: lead.id,
    channel,
    content: message.content,
    subject: message.subject,
    trigger: "new_lead",
    scheduledAt,
  });
}

function isQuietHours(settings: AutomationSettings): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const start = settings.quietHoursStart || 21;
  const end = settings.quietHoursEnd || 9;

  if (start > end) {
    return currentHour >= start || currentHour < end;
  }
  return currentHour >= start && currentHour < end;
}

function getNextSendTime(settings: AutomationSettings): Date {
  const now = new Date();
  const currentHour = now.getHours();
  const end = settings.quietHoursEnd || 9;

  if (isQuietHours(settings)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + (currentHour >= (settings.quietHoursStart || 21) ? 1 : 0));
    tomorrow.setHours(end, 0, 0, 0);
    return tomorrow;
  }

  return new Date(now.getTime() + 5 * 60 * 1000);
}

async function trackUsage(
  customerId: string, 
  metric: string, 
  quantity: number, 
  source: string
) {
  const period = new Date().toISOString().slice(0, 7);
  await storage.createUsageRecord({
    customerId,
    metric: metric as any,
    quantity,
    period,
    source: source as any,
  });
}

export async function scheduleManualMessage(
  customerId: string,
  leadId: string,
  channel: "whatsapp" | "email",
  content: string,
  subject?: string
) {
  const lead = await storage.getLead(leadId);
  if (!lead) throw new Error("Lead not found");

  await storage.createMessageJob({
    customerId,
    leadId,
    channel,
    content,
    subject,
    trigger: "manual",
    scheduledAt: new Date(),
  });

  await trackUsage(customerId, channel === "whatsapp" ? "messages_whatsapp" : "messages_email", 1, "manual");
}

async function processScheduledReports() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentMinute = now.getMinutes();

  if (currentMinute !== 0 || currentHour !== 8) return;

  try {
    const customers = await storage.getCustomers();

    for (const customer of customers) {
      if (!customer.email || !customer.emailVerified) continue;

      const planId = customer.plan || "basic";
      const reportsPerWeek = getReportsPerWeek(planId);
      const planConfig = getPlanConfig(planId);

      let shouldSendReport = false;

      if (reportsPerWeek === 7) {
        shouldSendReport = true;
      } else if (reportsPerWeek === 3) {
        shouldSendReport = currentDay === 1 || currentDay === 3 || currentDay === 5;
      } else if (reportsPerWeek === 1) {
        shouldSendReport = currentDay === 1;
      }

      if (!shouldSendReport) continue;

      const leads = await storage.getLeadsByCustomer(customer.id);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newLeadsThisWeek = leads.filter(l => new Date(l.createdAt) >= oneWeekAgo).length;
      const hotLeads = leads.filter(l => l.status === "quente").length;
      const warmLeads = leads.filter(l => l.status === "morno").length;
      const coldLeads = leads.filter(l => l.status === "frio").length;

      const events = await storage.getCalendarEvents();
      const customerEvents = events.filter((e: any) => e.customerId === customer.id);
      const scheduledEvents = customerEvents.filter((e: any) => e.status === "scheduled").length;

      const pendingJobs = await storage.getPendingMessageJobs();
      const customerJobs = pendingJobs.filter((j: MessageJob) => j.customerId === customer.id);
      const messagesSent = customerJobs.length;

      const locationCounts: Record<string, number> = {};
      leads.forEach(l => {
        const loc = l.location || "Desconhecido";
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });
      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const conversionRate = leads.length > 0 ? (hotLeads / leads.length) * 100 : undefined;

      const periodLabel = reportsPerWeek === 7 ? "Diario" : reportsPerWeek === 3 ? "Semanal" : "Semanal";

      await sendWeeklyReportEmail(customer.email, {
        customerName: customer.name || "Cliente",
        planName: planConfig?.name || "ImoLead Basic",
        period: periodLabel,
        totalLeads: leads.length,
        newLeadsThisWeek,
        hotLeads,
        warmLeads,
        coldLeads,
        scheduledEvents,
        messagesSent,
        topLocations,
        conversionRate: planConfig?.limits.hasAdvancedAI ? conversionRate : undefined,
      });

      console.log(`[Scheduler] Report sent to ${customer.email} (${planId})`);
    }
  } catch (error) {
    console.error("[Scheduler] Error processing reports:", error);
  }
}
