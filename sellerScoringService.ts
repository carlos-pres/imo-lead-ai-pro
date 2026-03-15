export function calculateSellerScore(property: any) {

  let score = 0

  if (property.daysOnline > 60) score += 30
  if (property.priceDrops > 1) score += 25
  if (property.ownerType === "private") score += 20

  return score
}
