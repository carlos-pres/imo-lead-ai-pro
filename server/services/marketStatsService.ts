import { getAllLeads } from "../storage";

export async function getMarketStats() {
  try {
    const results = await getAllLeads();

    return {
      total: results.length,
      leads: results,
    };
  } catch (error) {
    console.error("Erro ao buscar market stats:", error);
    throw new Error("Erro ao buscar dados do mercado");
  }
}
