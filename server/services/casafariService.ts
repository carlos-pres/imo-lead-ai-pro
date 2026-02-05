import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CasafariSearchParams {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  source?: string;
}

interface CasafariListing {
  id: string;
  title: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms?: number;
  area?: number;
  contact?: string;
  email?: string;
  source: string;
  url?: string;
  description?: string;
}

interface NormalizedLead {
  name: string;
  property: string;
  propertyType: string;
  location: string;
  price: string;
  source: string;
  sourceUrl?: string;
  contact: string;
  email?: string;
}

export async function searchCasafari(
  params: CasafariSearchParams,
  apiKey?: string
): Promise<{ listings: CasafariListing[]; error?: string }> {
  if (!apiKey) {
    console.log("Casafari API key not configured - returning mock data for demo");
    return { listings: generateMockListings(params) };
  }

  try {
    const queryParams = new URLSearchParams();
    if (params.location) queryParams.append("location", params.location);
    if (params.priceMin) queryParams.append("price_min", params.priceMin.toString());
    if (params.priceMax) queryParams.append("price_max", params.priceMax.toString());
    if (params.propertyType) queryParams.append("property_type", params.propertyType);

    const response = await fetch(
      `https://api.casafari.com/v1/listings?${queryParams.toString()}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { listings: [], error };
    }

    const data = await response.json();
    return { listings: normalizeListings(data.listings || []) };
  } catch (error: any) {
    console.error("Casafari API error:", error);
    return { listings: [], error: error.message };
  }
}

function normalizeListings(rawListings: any[]): CasafariListing[] {
  return rawListings.map((listing, index) => ({
    id: listing.id || `casafari-${Date.now()}-${index}`,
    title: listing.title || listing.description?.substring(0, 100) || "Propriedade",
    price: formatPrice(listing.price),
    location: listing.location || listing.address || "Portugal",
    propertyType: normalizePropertyType(listing.property_type || listing.type),
    bedrooms: listing.bedrooms,
    area: listing.area,
    contact: listing.contact_phone || listing.phone || "",
    email: listing.contact_email || listing.email || "",
    source: "Casafari",
    url: listing.url,
    description: listing.description,
  }));
}

function formatPrice(price: number | string): string {
  if (!price) return "Sob consulta";
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(numPrice);
}

function normalizePropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    apartment: "Apartamento",
    house: "Moradia",
    villa: "Moradia",
    land: "Terreno",
    commercial: "Comercial",
    office: "Comercial",
    shop: "Comercial",
  };
  return typeMap[type?.toLowerCase()] || "Outro";
}

function generateMockListings(params: CasafariSearchParams): CasafariListing[] {
  const locations = params.location 
    ? [params.location] 
    : ["Lisboa", "Porto", "Cascais", "Sintra", "Oeiras"];
  
  const propertyTypes = params.propertyType 
    ? [params.propertyType] 
    : ["Apartamento", "Moradia", "Terreno"];

  const mockListings: CasafariListing[] = [];
  const count = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < count; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const basePrice = params.priceMin || 150000;
    const maxPrice = params.priceMax || 800000;
    const price = Math.floor(Math.random() * (maxPrice - basePrice) + basePrice);
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const area = Math.floor(Math.random() * 150) + 50;

    const listingId = `casafari-demo-${Date.now()}-${i}`;
    mockListings.push({
      id: listingId,
      title: `${propertyType} T${bedrooms} em ${location}`,
      price: formatPrice(price),
      location,
      propertyType,
      bedrooms,
      area,
      contact: `+351 9${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, "0")}`,
      email: `proprietario${i + 1}@example.com`,
      source: "Casafari",
      url: `https://www.casafari.com/pt/imovel/${listingId}`,
      description: `Excelente ${propertyType.toLowerCase()} com ${bedrooms} quartos e ${area}m2 em ${location}.`,
    });
  }

  return mockListings;
}

// Helper to normalize location to string (handles both string and object formats from different sources)
function normalizeLocationToString(location: any): string {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    // Handle Idealista format: { city, district, address }
    const parts = [
      location.city,
      location.district,
      location.address
    ].filter(Boolean);
    return parts.join(", ");
  }
  return String(location);
}

export function convertToLead(listing: CasafariListing | any): NormalizedLead {
  const locationStr = normalizeLocationToString(listing.location);
  return {
    name: extractOwnerName(listing) || `Proprietario - ${locationStr}`,
    property: listing.title,
    propertyType: listing.propertyType as any,
    location: locationStr,
    price: listing.price,
    source: listing.source || "Casafari",
    sourceUrl: listing.sourceUrl || listing.url || undefined,
    contact: listing.contact || "",
    email: listing.email,
  };
}

function extractOwnerName(listing: CasafariListing | any): string | null {
  return null;
}

export async function analyzeListingWithAI(listing: CasafariListing | any): Promise<{
  score: number;
  status: "quente" | "morno" | "frio";
  reasoning: string;
}> {
  const locationStr = normalizeLocationToString(listing.location);
  
  try {
    const prompt = `Analisa este anuncio imobiliario e classifica a qualidade do lead para um consultor imobiliario.

Dados do Anuncio:
- Titulo: ${listing.title}
- Localizacao: ${locationStr}
- Preco: ${listing.price}
- Tipo: ${listing.propertyType}
- Quartos: ${listing.bedrooms || "N/A"}
- Area: ${listing.area ? `${listing.area}m2` : "N/A"}
- Contacto: ${listing.contact ? "Disponivel" : "Nao disponivel"}
- Email: ${listing.email ? "Disponivel" : "Nao disponivel"}
- Fonte: ${listing.source}

Criterios de avaliacao:
1. Qualidade da localizacao (Lisboa, Porto, Cascais = premium)
2. Relacao preco/mercado
3. Completude das informacoes de contacto
4. Potencial de negocio

Responde em JSON:
{
  "score": numero de 0 a 100,
  "status": "quente" | "morno" | "frio",
  "reasoning": "explicacao curta em portugues"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      score: result.score || 50,
      status: result.status || "morno",
      reasoning: result.reasoning || "Analise padrao aplicada.",
    };
  } catch (error) {
    console.error("AI analysis error:", error);
    const hasContact = !!(listing.contact || listing.email);
    const isPremiumLocation = ["Lisboa", "Porto", "Cascais", "Sintra"].some(
      (loc) => locationStr.toLowerCase().includes(loc.toLowerCase())
    );

    let score = 50;
    if (hasContact) score += 20;
    if (isPremiumLocation) score += 15;

    return {
      score,
      status: score >= 70 ? "quente" : score >= 50 ? "morno" : "frio",
      reasoning: "Classificacao baseada em criterios padrao (contacto e localizacao).",
    };
  }
}

export async function checkDuplicateLead(
  listing: CasafariListing | any,
  existingLeads: { contact: string; email?: string; location: string }[]
): Promise<boolean> {
  const normalizedContact = listing.contact?.replace(/\s+/g, "").replace(/^\+/, "");
  const normalizedEmail = listing.email?.toLowerCase();
  const listingLocation = normalizeLocationToString(listing.location).toLowerCase();

  return existingLeads.some((lead) => {
    const existingContact = lead.contact?.replace(/\s+/g, "").replace(/^\+/, "");
    const existingEmail = lead.email?.toLowerCase();
    const leadLocation = normalizeLocationToString(lead.location).toLowerCase();

    if (normalizedContact && existingContact === normalizedContact) return true;
    if (normalizedEmail && existingEmail === normalizedEmail) return true;
    
    if (
      leadLocation && listingLocation &&
      leadLocation === listingLocation &&
      (!normalizedContact || !existingContact)
    ) {
      return true;
    }

    return false;
  });
}
