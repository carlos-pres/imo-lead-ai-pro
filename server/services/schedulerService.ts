import { discoverLeads } from "./leadDiscoveryService.js"
import { runMarketRadar } from "./marketRadarService.js"

const ONE_DAY = 24 * 60 * 60 * 1000

async function runDiscoveryCycle() {

  console.log("[Scheduler] Starting discovery cycle")

  const cities = [
    "Lisboa",
    "Cascais",
    "Sintra",
    "Oeiras"
  ]

  /* ANALISAR MERCADO PRIMEIRO */

  await runMarketRadar()

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