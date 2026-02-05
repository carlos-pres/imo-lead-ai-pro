import OpenAI from "openai";

export interface CasafariProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePerSqm: number;
  propertyType: string;
  transactionType: "sale" | "rent";
  location: {
    address: string;
    city: string;
    district: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    floor?: number;
    hasParking: boolean;
    hasGarden: boolean;
    hasPool: boolean;
    hasElevator: boolean;
    energyCertificate?: string;
  };
  images: string[];
  source: string;
  sourceUrl: string;
  listedAt: Date;
  updatedAt: Date;
  sellerContact?: {
    name?: string;
    phone?: string;
    email?: string;
    type: "private" | "agency";
  };
}

export interface CasafariSearchParams {
  location?: string;
  propertyType?: string;
  transactionType?: "sale" | "rent";
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  limit?: number;
  offset?: number;
}

export interface CasafariSearchResult {
  properties: CasafariProperty[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const MOCK_PROPERTIES: CasafariProperty[] = [
  {
    id: "cf-001",
    title: "Apartamento T3 com Vista Rio - Parque das Nações",
    description: "Magnífico apartamento T3 totalmente renovado com vista desafogada sobre o rio Tejo. Cozinha equipada, ar condicionado, lugar de garagem.",
    price: 485000,
    pricePerSqm: 4850,
    propertyType: "Apartamento",
    transactionType: "sale",
    location: {
      address: "Rua do Mar Vermelho, 15",
      city: "Lisboa",
      district: "Parque das Nações",
      postalCode: "1990-073",
      coordinates: { lat: 38.7677, lng: -9.0931 }
    },
    features: {
      bedrooms: 3,
      bathrooms: 2,
      area: 100,
      floor: 8,
      hasParking: true,
      hasGarden: false,
      hasPool: false,
      hasElevator: true,
      energyCertificate: "B"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-001",
    listedAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-11-28"),
    sellerContact: {
      name: "António Silva",
      phone: "+351 912 345 678",
      type: "private"
    }
  },
  {
    id: "cf-002",
    title: "Moradia V4 com Piscina - Cascais",
    description: "Moradia de luxo com 4 quartos, piscina aquecida, jardim privativo e vista mar. Acabamentos de alta qualidade.",
    price: 1250000,
    pricePerSqm: 5208,
    propertyType: "Moradia",
    transactionType: "sale",
    location: {
      address: "Avenida das Palmeiras, 42",
      city: "Cascais",
      district: "Estoril",
      postalCode: "2765-045",
      coordinates: { lat: 38.7013, lng: -9.3975 }
    },
    features: {
      bedrooms: 4,
      bathrooms: 4,
      area: 240,
      hasParking: true,
      hasGarden: true,
      hasPool: true,
      hasElevator: false,
      energyCertificate: "A"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-002",
    listedAt: new Date("2024-10-20"),
    updatedAt: new Date("2024-11-25"),
    sellerContact: {
      name: "RE/MAX Cascais",
      phone: "+351 214 567 890",
      email: "cascais@remax.pt",
      type: "agency"
    }
  },
  {
    id: "cf-003",
    title: "T2 Renovado - Baixa do Porto",
    description: "Apartamento T2 totalmente renovado no coração do Porto. Ideal para habitação própria ou investimento. Elevada rentabilidade.",
    price: 295000,
    pricePerSqm: 4214,
    propertyType: "Apartamento",
    transactionType: "sale",
    location: {
      address: "Rua das Flores, 78",
      city: "Porto",
      district: "Baixa",
      postalCode: "4050-265",
      coordinates: { lat: 41.1456, lng: -8.6127 }
    },
    features: {
      bedrooms: 2,
      bathrooms: 1,
      area: 70,
      floor: 2,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: true,
      energyCertificate: "C"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-003",
    listedAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-30"),
    sellerContact: {
      name: "Maria Costa",
      phone: "+351 918 765 432",
      email: "maria.costa@email.pt",
      type: "private"
    }
  },
  {
    id: "cf-004",
    title: "Loja Comercial - Avenida da Liberdade",
    description: "Espaço comercial de 150m² em localização premium. Ideal para comércio de luxo ou serviços. Grande montra.",
    price: 890000,
    pricePerSqm: 5933,
    propertyType: "Comercial",
    transactionType: "sale",
    location: {
      address: "Avenida da Liberdade, 180",
      city: "Lisboa",
      district: "Avenidas Novas",
      postalCode: "1250-146",
      coordinates: { lat: 38.7204, lng: -9.1456 }
    },
    features: {
      bedrooms: 0,
      bathrooms: 2,
      area: 150,
      floor: 0,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false,
      energyCertificate: "D"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-004",
    listedAt: new Date("2024-09-10"),
    updatedAt: new Date("2024-11-20"),
    sellerContact: {
      name: "Cushman & Wakefield",
      phone: "+351 213 456 789",
      email: "lisboa@cushwake.pt",
      type: "agency"
    }
  },
  {
    id: "cf-005",
    title: "Terreno para Construção - Sintra",
    description: "Terreno de 2000m² com projeto aprovado para moradia unifamiliar. Vistas para a Serra de Sintra. Acesso por estrada alcatroada.",
    price: 180000,
    pricePerSqm: 90,
    propertyType: "Terreno",
    transactionType: "sale",
    location: {
      address: "Estrada da Malveira, s/n",
      city: "Sintra",
      district: "Colares",
      postalCode: "2705-001",
      coordinates: { lat: 38.8029, lng: -9.4448 }
    },
    features: {
      bedrooms: 0,
      bathrooms: 0,
      area: 2000,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-005",
    listedAt: new Date("2024-08-15"),
    updatedAt: new Date("2024-11-10"),
    sellerContact: {
      name: "João Ferreira",
      phone: "+351 916 234 567",
      type: "private"
    }
  },
  {
    id: "cf-006",
    title: "T1 para Arrendamento - Alfama",
    description: "Estúdio encantador em edifício reabilitado no coração de Alfama. Mobiliado e equipado. Ideal para jovem profissional.",
    price: 950,
    pricePerSqm: 23.75,
    propertyType: "Apartamento",
    transactionType: "rent",
    location: {
      address: "Beco do Surra, 5",
      city: "Lisboa",
      district: "Alfama",
      postalCode: "1100-045",
      coordinates: { lat: 38.7134, lng: -9.1282 }
    },
    features: {
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      floor: 3,
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasElevator: false,
      energyCertificate: "C"
    },
    images: [],
    source: "Casafari",
    sourceUrl: "https://casafari.com/property/cf-006",
    listedAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-29"),
    sellerContact: {
      name: "Ana Rodrigues",
      phone: "+351 914 567 890",
      email: "ana.rodrigues@gmail.com",
      type: "private"
    }
  }
];

export class CasafariService {
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  async searchProperties(params: CasafariSearchParams): Promise<CasafariSearchResult> {
    let filteredProperties = [...MOCK_PROPERTIES];

    if (params.location) {
      const locationLower = params.location.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (p) =>
          p.location.city.toLowerCase().includes(locationLower) ||
          p.location.district.toLowerCase().includes(locationLower) ||
          p.location.address.toLowerCase().includes(locationLower)
      );
    }

    if (params.propertyType) {
      filteredProperties = filteredProperties.filter(
        (p) => p.propertyType.toLowerCase() === params.propertyType!.toLowerCase()
      );
    }

    if (params.transactionType) {
      filteredProperties = filteredProperties.filter(
        (p) => p.transactionType === params.transactionType
      );
    }

    if (params.minPrice !== undefined) {
      filteredProperties = filteredProperties.filter((p) => p.price >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      filteredProperties = filteredProperties.filter((p) => p.price <= params.maxPrice!);
    }

    if (params.minArea !== undefined) {
      filteredProperties = filteredProperties.filter((p) => p.features.area >= params.minArea!);
    }

    if (params.maxArea !== undefined) {
      filteredProperties = filteredProperties.filter((p) => p.features.area <= params.maxArea!);
    }

    if (params.bedrooms !== undefined) {
      filteredProperties = filteredProperties.filter(
        (p) => p.features.bedrooms >= params.bedrooms!
      );
    }

    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginatedProperties = filteredProperties.slice(offset, offset + limit);

    return {
      properties: paginatedProperties,
      total: filteredProperties.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < filteredProperties.length
    };
  }

  async getPropertyById(id: string): Promise<CasafariProperty | null> {
    const property = MOCK_PROPERTIES.find((p) => p.id === id);
    return property || null;
  }

  async convertToLead(property: CasafariProperty): Promise<{
    name: string;
    contact: string;
    email: string | null;
    property: string;
    propertyType: string;
    location: string;
    price: string;
    source: string;
    notes: string;
  }> {
    const priceStr = property.transactionType === "rent" 
      ? `${property.price}€/mês` 
      : `${property.price.toLocaleString("pt-PT")}€`;

    return {
      name: property.sellerContact?.name || "Proprietário",
      contact: property.sellerContact?.phone || "",
      email: property.sellerContact?.email || null,
      property: property.title,
      propertyType: property.propertyType as any,
      location: `${property.location.city}, ${property.location.district}`,
      price: priceStr,
      source: "Casafari",
      notes: `${property.description}\n\nFonte: ${property.sourceUrl}\nT${property.features.bedrooms} | ${property.features.area}m² | Cert. Energético: ${property.features.energyCertificate || "N/A"}`
    };
  }
}

export const casafariService = new CasafariService(process.env.CASAFARI_API_KEY);
