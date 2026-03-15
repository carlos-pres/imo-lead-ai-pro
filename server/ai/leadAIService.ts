export function classifyLead(message: string) {

  if (message.includes("vender")) return "quente"
  if (message.includes("talvez")) return "morno"

  return "frio"
}