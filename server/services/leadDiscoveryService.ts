import { runLeadAgent } from "../ai/agentService.js";
import { logAgentAction, logAgentError } from "../lib/logger.js";
import { checkRateLimit, getCachedResult, setCachedResult, generateLeadCacheKey } from "../lib/agentCache.js";
import { searchIdealista, type IdealistaSearchParams } from "../lib/idealista.js";
import { casafariService, type CasafariProperty } from "../lib/casafari.js";
import { searchOLX, type OLXSearchParams } from "../lib/olx.js";

export interface DiscoveredLead {
  name?: string;
  property: string;
  propertyType?: string;
  location: string;
  price: number;
  contact?: string;
  source: string;
  daysOnline?: number;
  priceDrops?: number;
  ownerType?: string;
}

/**
 * Discover leads from real estate portals
 * Combines data from Idealista, Casafari, OLX, and other sources
 */
export async function discoverLeads(city: string): Promise<DiscoveredLead[]> {
  const startTime = Date.now();
  const allLeads: DiscoveredLead[] = [];

  try {
    // Check rate limiting
    const rateLimit = checkRateLimit("lead_discovery", 1000);
    if (!rateLimit.allowed) {
      logAgentError(
        "LeadDiscovery",
        "RateLimitExceeded",
        `Rate limit hit. Remaining quota: ${rateLimit.remaining} (resets in ${rateLimit.resetInSeconds}s)`
      );
      return [];
    }

    logAgentAction("LeadDiscovery", "StartScan", { city, timestamp: new Date().toISOString() });

    // 1. Search Idealista (Portugal's largest portal)
    if (process.env.IDEALISTA_API_KEY) {
      try {
        const searchParams: IdealistaSearchParams = {
          location: city,
          operation: "sale",
          propertyType: "all",
        };
        const idealistaLeads = await searchIdealista(searchParams);
        const convertedLeads = idealistaLeads.map((prop) => ({
          name: prop.sellerContact?.name || "Proprietario",
          property: prop.title || city,
          propertyType: prop.propertyType,
          location: prop.location?.city || city,
          price: prop.price || 0,
          contact: prop.sellerContact?.phone || "unknown",
          source: "idealista",
          daysOnline: prop.listedAt
            ? Math.floor((Date.now() - new Date(prop.listedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          priceDrops: 0, // Could be tracked separately
          ownerType: prop.sellerContact?.type || "private",
        }));

        logAgentAction(
          "LeadDiscovery",
          "Idealista",
          { city, leadsFound: idealistaLeads.length },
          0.05,
          Date.now() - startTime
        );
        allLeads.push(...convertedLeads);
      } catch (error) {
        logAgentError("LeadDiscovery", "Idealista", error as Error, { city });
      }
    }

    // 2. Search Casafari (Premium segment)
    if (process.env.CASAFARI_API_KEY) {
      try {
        const casafariResult = await casafariService.searchProperties({ location: city });
        const casafariLeads = casafariResult.properties;
        const convertedLeads = casafariLeads.map((prop: CasafariProperty) => ({
          name: prop.sellerContact?.name || "Proprietario",
          property: prop.title || `${prop.propertyType || "Imovel"} ${city}`,
          propertyType: prop.propertyType,
          location: prop.location?.city || city,
          price: prop.price || 0,
          contact: prop.sellerContact?.phone || "unknown",
          source: "casafari",
          daysOnline: prop.listedAt
            ? Math.floor((Date.now() - new Date(prop.listedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          priceDrops: 0,
          ownerType: prop.sellerContact?.type || "private",
        }));

        logAgentAction(
          "LeadDiscovery",
          "Casafari",
          { city, leadsFound: casafariLeads.length },
          0.03,
          Date.now() - startTime
        );
        allLeads.push(...convertedLeads);
      } catch (error) {
        logAgentError("LeadDiscovery", "Casafari", error as Error, { city });
      }
    }

    // 3. Search OLX (Budget properties)
    if (process.env.OLX_API_KEY) {
      try {
        const searchParams: OLXSearchParams = {
          location: city,
        };
        const olxLeads = await searchOLX(searchParams);
        const convertedLeads = olxLeads.map((prop) => ({
          name: prop.sellerContact?.name || "Proprietario",
          property: prop.title || `Imovel ${city}`,
          propertyType: prop.propertyType,
          location: prop.location || city,
          price: prop.price || 0,
          contact: prop.sellerContact?.phone || "unknown",
          source: "olx",
          daysOnline: prop.createdAt
            ? Math.floor((Date.now() - new Date(prop.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          priceDrops: 0,
          ownerType: prop.sellerContact?.type || "private",
        }));

        logAgentAction(
          "LeadDiscovery",
          "OLX",
          { city, leadsFound: olxLeads.length },
          0.02,
          Date.now() - startTime
        );
        allLeads.push(...convertedLeads);
      } catch (error) {
        logAgentError("LeadDiscovery", "OLX", error as Error, { city });
      }
    }

    // Process each lead through agent scoring
    for (const lead of allLeads) {
      try {
        // Check cache first
        const cacheKey = generateLeadCacheKey(lead);
        const cached = getCachedResult(cacheKey);
        
        if (cached) {
          logAgentAction("LeadDiscovery", "CacheHit", { property: lead.property, source: lead.source });
          continue;
        }

        // Score with agent
        const aiResult = await runLeadAgent(lead);
        
        // Cache for 24 hours
        setCachedResult(cacheKey, aiResult, 86400000);

        logAgentAction(
          "LeadDiscovery",
          "Scored",
          {
            property: lead.property,
            score: aiResult.aiScore,
            status: aiResult.status,
          }
        );
      } catch (error) {
        logAgentError("LeadDiscovery", "ScoringFailed", error as Error, {
          property: lead.property,
          source: lead.source,
        });
      }
    }

    const duration = Date.now() - startTime;
    logAgentAction("LeadDiscovery", "Complete", { city, totalLeads: allLeads.length, duration });

    return allLeads;
  } catch (error) {
    const duration = Date.now() - startTime;
    logAgentError("LeadDiscovery", "Failed", error as Error, {
      city,
      duration,
      leadsProcessed: allLeads.length,
    });
    return allLeads; // Return partial results if available
  }
}
