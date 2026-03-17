import { discoverLeads } from "./leadDiscoveryService.js"
import { analyzeMarketOpportunities } from "../ai/marketStrategistAgent.js"

const ONE_DAY = 24 * 60 * 60 * 1000

async function runDiscoveryCycle() {

  console.log("[Scheduler] Starting discovery cycle")

  // Target cities for lead discovery in Portugal
// Phase 1: Portugal market coverage
// Phase 2 (coming soon): Expansion to all Europe
// Phase 3 (future): Global expansion including Dubai and other high-value markets

const cities = [
  "Lisboa",
  "Amadora",
  "Odivelas",
  "Loures",
  "Cascais",
  "Sintra",
  "Oeiras",
  "Almada",
  "Setúbal",

  "Porto",
  "Vila Nova de Gaia",
  "Matosinhos",
  "Maia",
  "Gondomar",
  "Valongo",

  "Braga",
  "Guimarães",
  "Barcelos",

  "Aveiro",
  "Coimbra",
  "Leiria",

  "Faro",
  "Loulé",
  "Albufeira",
  "Portimão",
  "Lagos",

  "Viseu",
  "Castelo Branco",
  "Évora",
  "Beja",

  "Funchal",
  "Ponta Delgada"
];
  

  /* ANALISAR MERCADO PRIMEIRO */

 await analyzeMarketOpportunities() 

  /* DESCOBRIR LEADS */

  for (const city of cities) {

    try {

      const leads = await discoverLeads(city)

      console.log(`[Scheduler] leads encontrados em ${city}:`, leads.length)

    } catch (err) {

      console.error("[Scheduler] erro na cidade", city, err)

    }

  }

  console.log("[Scheduler] cycle completed")

}

export function startScheduler() {

  console.log("[Scheduler] Engine started")

  runDiscoveryCycle()

  setInterval(() => {

    runDiscoveryCycle()

  }, ONE_DAY)

}