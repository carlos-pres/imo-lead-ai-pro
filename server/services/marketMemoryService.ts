export function detectMarketAnomaly(lead: any, memory: any) {

  const price = Number(lead.price)
  const area = Number(lead.area)

  if (!price || !area) return false

  const pricePerM2 = price / area

  if (pricePerM2 < memory.avgPricePerM2 * 0.75) {
    return true
  }

  return false
}