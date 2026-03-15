import * as storage from "../storage.js"

export async function discoverLeads(city: string) {

  console.log("Scanning city", city)

  const properties = [
    {
      name: "Proprietário",
      property: "T2 Centro Lisboa",
      daysOnline: 70,
      priceDrops: 2,
      ownerType: "private"
    }
  ]

  for (const p of properties) {

    await storage.createLead({
      customerId: "system",
      name: p.name,
      property: p.property
    })

  }

  return properties
}
