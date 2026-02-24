import { CasafariProperty } from "./casafari.js";

const IDEALISTA_API_KEY = process.env.IDEALISTA_API_KEY;
const IDEALISTA_API_SECRET = process.env.IDEALISTA_API_SECRET;

interface IdealistaSearchParams {
  location?: string;
  propertyType?: string;
  operation?: "sale" | "rent";
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
}

interface IdealistaToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: IdealistaToken | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!IDEALISTA_API_KEY || !IDEALISTA_API_SECRET) {
    return null;
  }

  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  try {
    const credentials = Buffer.from(`${IDEALISTA_API_KEY}:${IDEALISTA_API_SECRET}`).toString("base64");
    
    const response = await fetch("https://api.idealista.com/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials&scope=read"
    });

    if (!response.ok) {
      console.error("[Idealista] Token error:", response.status);
      return null;
    }

    const data = await response.json();
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000) - 60000
    };
    
    return cachedToken.access_token;
  } catch (error) {
    console.error("[Idealista] Token fetch failed:", error);
    return null;
  }
}

const locationIds: Record<string, string> = {
  "lisboa": "0-EU-PT-11",
  "porto": "0-EU-PT-13",
  "faro": "0-EU-PT-08",
  "coimbra": "0-EU-PT-06",
  "braga": "0-EU-PT-03",
  "setubal": "0-EU-PT-15",
  "aveiro": "0-EU-PT-01",
  "leiria": "0-EU-PT-10",
  "cascais": "0-EU-PT-11-01-01-009",
  "sintra": "0-EU-PT-11-01-01-017",
  "oeiras": "0-EU-PT-11-01-01-012",
};

export async function searchIdealista(params: IdealistaSearchParams): Promise<CasafariProperty[]> {
  const token = await getAccessToken();
  
  if (!token) {
    console.log("[Idealista] No API credentials - using demo data");
    return getMockIdealistaProperties(params);
  }

  try {
    const locationKey = params.location?.toLowerCase() || "lisboa";
    const locationId = locationIds[locationKey] || locationIds["lisboa"];

    const formData = new URLSearchParams();
    formData.append("country", "pt");
    formData.append("locale", "pt");
    formData.append("locationId", locationId);
    formData.append("propertyType", params.propertyType === "Apartamento" ? "homes" : "homes");
    formData.append("operation", params.operation || "sale");
    formData.append("maxItems", "50");
    formData.append("numPage", "1");
    formData.append("order", "publicationDate");
    formData.append("sort", "desc");

    if (params.minPrice) formData.append("minPrice", params.minPrice.toString());
    if (params.maxPrice) formData.append("maxPrice", params.maxPrice.toString());
    if (params.minSize) formData.append("minSize", params.minSize.toString());
    if (params.maxSize) formData.append("maxSize", params.maxSize.toString());
    if (params.bedrooms) formData.append("bedrooms", params.bedrooms.toString());

    const response = await fetch("https://api.idealista.com/3.5/pt/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    if (!response.ok) {
      console.error("[Idealista] Search error:", response.status);
      return getMockIdealistaProperties(params);
    }

    const data = await response.json();
    return transformIdealistaResponse(data.elementList || []);
  } catch (error) {
    console.error("[Idealista] Search failed:", error);
    return getMockIdealistaProperties(params);
  }
}

function transformIdealistaResponse(properties: any[]): CasafariProperty[] {
  return properties.map((p, index) => ({
    id: `idealista-${p.propertyCode || index}`,
    title: p.suggestedTexts?.title || `${p.propertyType} T${p.rooms || 0} - ${p.municipality}`,
    description: p.description || p.suggestedTexts?.subtitle || "",
    price: p.price || 0,
    pricePerSqm: p.priceByArea || 0,
    propertyType: mapPropertyType(p.propertyType),
    transactionType: p.operation === "rent" ? "rent" : "sale",
    location: {
      address: p.address || "",
      city: p.municipality || "",
      district: p.district || p.neighborhood || "",
      postalCode: "",
      coordinates: {
        lat: p.latitude || 0,
        lng: p.longitude || 0
      }
    },
    features: {
      bedrooms: p.rooms || 0,
      bathrooms: p.bathrooms || 0,
      area: p.size || 0,
      floor: parseInt(p.floor) || 0,
      hasParking: p.parkingSpace?.hasParkingSpace || false,
      hasGarden: p.hasGarden || false,
      hasPool: p.hasSwimmingPool || false,
      hasElevator: p.hasLift || false,
      energyCertificate: p.labels?.energeticCertification || ""
    },
    images: p.multimedia?.images?.map((img: any) => img.url) || [],
    source: "Idealista",
    sourceUrl: p.url || `https://www.idealista.pt/imovel/${p.propertyCode}/`,
    listedAt: p.modificationDate ? new Date(p.modificationDate) : new Date(),
    updatedAt: p.modificationDate ? new Date(p.modificationDate) : new Date(),
    sellerContact: {
      name: p.contactInfo?.contactName || "Contacto Idealista",
      phone: p.contactInfo?.phone1?.phoneNumber || "",
      email: "",
      type: p.contactInfo?.profesionalName ? "agency" : "private"
    }
  }));
}

function mapPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    flat: "Apartamento",
    chalet: "Moradia",
    duplex: "Duplex",
    penthouse: "Penthouse",
    studio: "Estúdio",
    house: "Moradia",
    countryHouse: "Quinta",
  };
  return typeMap[type] || "Apartamento";
}

function getMockIdealistaProperties(params: IdealistaSearchParams): CasafariProperty[] {
  const location = params.location?.toLowerCase() || "lisboa";
  
  const mockData: CasafariProperty[] = [
    {
      id: "idealista-001",
      title: "Apartamento T2 Renovado - Baixa",
      description: "Apartamento totalmente renovado no coração da cidade. Cozinha equipada, ar condicionado, excelente luminosidade.",
      price: 320000,
      pricePerSqm: 4571,
      propertyType: "Apartamento",
      transactionType: "sale",
      location: {
        address: "Rua Augusta, 45",
        city: location === "porto" ? "Porto" : "Lisboa",
        district: location === "porto" ? "Ribeira" : "Baixa-Chiado",
        postalCode: location === "porto" ? "4050-012" : "1100-053",
        coordinates: { lat: 38.7107, lng: -9.1366 }
      },
      features: {
        bedrooms: 2,
        bathrooms: 1,
        area: 70,
        floor: 3,
        hasParking: false,
        hasGarden: false,
        hasPool: false,
        hasElevator: true,
        energyCertificate: "C"
      },
      images: [],
      source: "Idealista",
      sourceUrl: "https://www.idealista.pt/imovel/12345678/",
      listedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      sellerContact: {
        name: "RE/MAX Lisboa",
        phone: "+351 213 456 789",
        email: "info@remax-lisboa.pt",
        type: "agency"
      }
    },
    {
      id: "idealista-002",
      title: "Moradia T4 com Jardim - Cascais",
      description: "Moradia espaçosa com jardim privado e piscina. Zona residencial tranquila, próximo da praia.",
      price: 890000,
      pricePerSqm: 3560,
      propertyType: "Moradia",
      transactionType: "sale",
      location: {
        address: "Rua das Flores, 22",
        city: "Cascais",
        district: "Estoril",
        postalCode: "2765-001",
        coordinates: { lat: 38.7016, lng: -9.3968 }
      },
      features: {
        bedrooms: 4,
        bathrooms: 3,
        area: 250,
        floor: 0,
        hasParking: true,
        hasGarden: true,
        hasPool: true,
        hasElevator: false,
        energyCertificate: "B"
      },
      images: [],
      source: "Idealista",
      sourceUrl: "https://www.idealista.pt/imovel/87654321/",
      listedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sellerContact: {
        name: "João Fernandes",
        phone: "+351 916 789 012",
        type: "private"
      }
    },
    {
      id: "idealista-003",
      title: "T1 para Arrendamento - Arroios",
      description: "Excelente T1 mobilado, ideal para jovem profissional. Metro à porta, todas as comodidades.",
      price: 1100,
      pricePerSqm: 22,
      propertyType: "Apartamento",
      transactionType: "rent",
      location: {
        address: "Avenida Almirante Reis, 180",
        city: "Lisboa",
        district: "Arroios",
        postalCode: "1000-055",
        coordinates: { lat: 38.7292, lng: -9.1350 }
      },
      features: {
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
        floor: 5,
        hasParking: false,
        hasGarden: false,
        hasPool: false,
        hasElevator: true,
        energyCertificate: "B-"
      },
      images: [],
      source: "Idealista",
      sourceUrl: "https://www.idealista.pt/imovel/11223344/",
      listedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      sellerContact: {
        name: "Century 21 Arroios",
        phone: "+351 218 456 123",
        email: "arroios@century21.pt",
        type: "agency"
      }
    },
    {
      id: "idealista-004",
      title: "Loft Industrial - LX Factory",
      description: "Loft único em edifício histórico reconvertido. Pé direito duplo, design moderno, ambiente inspirador.",
      price: 450000,
      pricePerSqm: 5000,
      propertyType: "Apartamento",
      transactionType: "sale",
      location: {
        address: "Rua Rodrigues Faria, 103",
        city: "Lisboa",
        district: "Alcântara",
        postalCode: "1300-501",
        coordinates: { lat: 38.7034, lng: -9.1773 }
      },
      features: {
        bedrooms: 1,
        bathrooms: 2,
        area: 90,
        floor: 2,
        hasParking: true,
        hasGarden: false,
        hasPool: false,
        hasElevator: true,
        energyCertificate: "A"
      },
      images: [],
      source: "Idealista",
      sourceUrl: "https://www.idealista.pt/imovel/55667788/",
      listedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sellerContact: {
        name: "Sotheby's International Realty",
        phone: "+351 213 999 888",
        email: "portugal@sothebys.com",
        type: "agency"
      }
    }
  ];

  let filtered = mockData;

  if (location && !["lisboa", "portugal", ""].includes(location)) {
    filtered = filtered.filter(p => 
      p.location.city.toLowerCase().includes(location) ||
      p.location.district.toLowerCase().includes(location)
    );
  }

  if (params.operation === "rent") {
    filtered = filtered.filter(p => p.transactionType === "rent");
  } else if (params.operation === "sale") {
    filtered = filtered.filter(p => p.transactionType === "sale");
  }

  if (params.minPrice) {
    filtered = filtered.filter(p => p.price >= params.minPrice!);
  }
  if (params.maxPrice) {
    filtered = filtered.filter(p => p.price <= params.maxPrice!);
  }

  return filtered.length > 0 ? filtered : mockData.slice(0, 2);
}
