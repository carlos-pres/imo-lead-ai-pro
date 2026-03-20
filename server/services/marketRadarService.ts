import { createLead as createStoredLead } from "../storage";

type LeadInput = {
  name: string;
  price: number;
  area?: number;
  location: string;
};

export async function createLead(data: LeadInput) {
  try {
    return await createStoredLead({
      name: data.name,
      price: data.price,
      area: data.area ?? null,
      location: data.location,
    });
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    throw new Error("Falha ao criar lead");
  }
}
