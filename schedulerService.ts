import { discoverLeads } from "./leadDiscoveryService.js"

export function startScheduler() {

  console.log("ImoLead discovery engine started")

  setInterval(async () => {

    await discoverLeads("Lisboa")

  }, 24 * 60 * 60 * 1000)

}