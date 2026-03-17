import { db } from "../db/index.js"
import { leads } from "../db/schema.js"
import { eq } from "drizzle-orm"

/* ================= CALCULAR MÉDIA DO MERCADO ================= */

export async function getAveragePricePerM2(city: string) {

  const results = await db.query.leads.findMany({
    where: eq(leads.location, city)
  })

  console.log("[MARKET] leads encontrados:", results.length)

  let total = 0
  let count = 0

  for (const lead of results) {

    const price = Number(lead.price)
    const area = Number(lead.area)

    if (!price || !area) continue

    const pricePerM2 = price / area

    total += pricePerM2
    count++
  }

  if (count === 0) return null

  const avg = total / count

  console.log("[MARKET] média m2:", avg)

  return avg
}

/* ================= DETECTAR OPORTUNIDADE ================= */

export async function detectOpportunity(lead: any) {

  const avg = await getAveragePricePerM2(lead.location)

  if (!avg) {
    console.log("[MARKET] sem dados suficientes ainda")
    return false
  }

  const price = Number(lead.price)
  const area = Number(lead.area)

  if (!price || !area) return false

  const pricePerM2 = price / area

  console.log("[MARKET] preço m2 do lead:", pricePerM2)

  /* se estiver 25% abaixo da média do mercado */

  if (pricePerM2 < avg * 0.75) {

    console.log("[MARKET] oportunidade detectada")

    return true
  }

  return false
}