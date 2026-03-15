import { runLeadAgent } from "../ai/agentService.js"

export async function discoverLeads(city: string) {

  console.log("Scanning city", city)

  const leads = [
    {
      name: "Proprietário",
      property: "T2 Centro Lisboa",
      propertyType: "apartamento",
      location: city,
      price: 320000,
      contact: "unknown",
      source: "idealista",
      daysOnline: 70,
      priceDrops: 2,
      ownerType: "private"
    }
  ]

  for (const lead of leads) {

    const ai = await runLeadAgent(lead)

    console.log("AI RESULT:")
    console.log(ai)

  }

  return leads

}