import * as cheerio from "cheerio";

interface OLXSearchParams {
  location?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  operation?: "sale" | "rent";
}

interface OLXProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  propertyType: string;
  bedrooms?: number;
  area?: number;
  source: string;
  sourceUrl: string;
  sellerContact?: {
    name?: string;
    phone?: string;
    email?: string;
    type: "private" | "agency";
  };
  createdAt: string;
}

const OLX_DEMO_PROPERTIES: OLXProperty[] = [
  {
    id: "olx-1",
    title: "Apartamento T2 Renovado - Centro Histórico",
    description: "Apartamento totalmente renovado no centro histórico. Exposição solar nascente/poente. Próximo de transportes e comércio.",
    price: 185000,
    location: "Lisboa",
    propertyType: "Apartamento",
    bedrooms: 2,
    area: 75,
    source: "OLX",
    sourceUrl: "https://www.olx.pt/imoveis/apartamento-t2-centro",
    sellerContact: {
      name: "António Costa",
      phone: "+351 912 345 678",
      type: "private"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "olx-2",
    title: "Moradia V3 com Jardim - Matosinhos",
    description: "Moradia independente com jardim privativo. 3 quartos, 2 casas de banho. Garagem para 2 carros. Zona residencial tranquila.",
    price: 320000,
    location: "Porto",
    propertyType: "Moradia",
    bedrooms: 3,
    area: 140,
    source: "OLX",
    sourceUrl: "https://www.olx.pt/imoveis/moradia-v3-matosinhos",
    sellerContact: {
      name: "Maria Silva",
      phone: "+351 923 456 789",
      type: "private"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "olx-3",
    title: "T1 Moderno - Parque das Nações",
    description: "Apartamento T1 moderno com varanda. Vista rio. Condomínio com piscina e ginásio. Ideal para investimento.",
    price: 245000,
    location: "Lisboa",
    propertyType: "Apartamento",
    bedrooms: 1,
    area: 55,
    source: "OLX",
    sourceUrl: "https://www.olx.pt/imoveis/t1-parque-nacoes",
    sellerContact: {
      name: "João Fernandes",
      phone: "+351 934 567 890",
      email: "joao.fernandes@email.pt",
      type: "private"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "olx-4",
    title: "Apartamento T3 - Foz do Douro",
    description: "Excelente apartamento T3 na Foz. Vista mar parcial. 2 lugares de estacionamento. Arrecadação. Prédio com elevador.",
    price: 395000,
    location: "Porto",
    propertyType: "Apartamento",
    bedrooms: 3,
    area: 120,
    source: "OLX",
    sourceUrl: "https://www.olx.pt/imoveis/t3-foz-douro",
    sellerContact: {
      name: "Imobiliária Costa Atlântica",
      phone: "+351 220 123 456",
      email: "info@costaatlantica.pt",
      type: "agency"
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "olx-5",
    title: "Moradia Geminada T4 - Cascais",
    description: "Moradia geminada com 4 quartos. Piscina privativa. Jardim com 200m². Zona nobre de Cascais. Excelentes acabamentos.",
    price: 650000,
    location: "Cascais",
    propertyType: "Moradia",
    bedrooms: 4,
    area: 200,
    source: "OLX",
    sourceUrl: "https://www.olx.pt/imoveis/moradia-t4-cascais",
    sellerContact: {
      name: "Pedro Martins",
      phone: "+351 945 678 901",
      type: "private"
    },
    createdAt: new Date().toISOString()
  }
];

const LOCATION_SLUGS: Record<string, string> = {
  "lisboa": "lisboa",
  "porto": "porto",
  "cascais": "cascais",
  "sintra": "sintra",
  "oeiras": "oeiras",
  "amadora": "amadora",
  "braga": "braga",
  "coimbra": "coimbra",
  "faro": "faro",
  "setubal": "setubal",
  "aveiro": "aveiro",
  "leiria": "leiria",
  "funchal": "funchal",
  "almada": "almada",
  "matosinhos": "matosinhos",
  "gaia": "vila-nova-de-gaia",
  "vila nova de gaia": "vila-nova-de-gaia",
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function buildOLXUrl(params: OLXSearchParams): string {
  let url = "https://www.olx.pt/d/imoveis/";
  
  const operation = params.operation || "sale";
  if (operation === "sale") {
    url += "venda/";
  } else {
    url += "arrendamento/";
  }
  
  if (params.location) {
    const locationSlug = LOCATION_SLUGS[params.location.toLowerCase()] || params.location.toLowerCase().replace(/\s+/g, "-");
    url += `q-${locationSlug}/`;
  }
  
  const queryParams: string[] = [];
  
  if (params.minPrice) {
    queryParams.push(`search%5Bfilter_float_price:from%5D=${params.minPrice}`);
  }
  if (params.maxPrice) {
    queryParams.push(`search%5Bfilter_float_price:to%5D=${params.maxPrice}`);
  }
  
  if (queryParams.length > 0) {
    url += "?" + queryParams.join("&");
  }
  
  return url;
}

function extractPrice(priceText: string): number {
  const cleaned = priceText.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

function extractPropertyType(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("moradia") || titleLower.includes("vivenda") || titleLower.includes("v1") || titleLower.includes("v2") || titleLower.includes("v3") || titleLower.includes("v4") || titleLower.includes("v5")) {
    return "Moradia";
  }
  if (titleLower.includes("apartamento") || titleLower.includes("t0") || titleLower.includes("t1") || titleLower.includes("t2") || titleLower.includes("t3") || titleLower.includes("t4") || titleLower.includes("t5")) {
    return "Apartamento";
  }
  if (titleLower.includes("terreno") || titleLower.includes("lote")) {
    return "Terreno";
  }
  if (titleLower.includes("loja") || titleLower.includes("escritório") || titleLower.includes("armazém") || titleLower.includes("comercial")) {
    return "Comercial";
  }
  return "Outro";
}

function extractBedrooms(title: string): number | undefined {
  const match = title.match(/[tTvV](\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

function extractArea(text: string): number | undefined {
  const match = text.match(/(\d+)\s*m[²2]/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return undefined;
}

async function scrapeOLX(params: OLXSearchParams): Promise<OLXProperty[]> {
  const url = buildOLXUrl(params);
  console.log(`[OLX] Scraping URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-PT,pt;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
    });

    if (!response.ok) {
      console.error(`[OLX] HTTP error: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const properties: OLXProperty[] = [];
    
    $('[data-testid="listing-grid"] [data-cy="l-card"]').each((index, element) => {
      try {
        const $el = $(element);
        
        const titleEl = $el.find('h6, [data-cy="ad-card-title"]');
        const title = titleEl.text().trim();
        if (!title) return;
        
        const linkEl = $el.find('a').first();
        const href = linkEl.attr('href');
        const sourceUrl = href ? (href.startsWith('http') ? href : `https://www.olx.pt${href}`) : '';
        
        const priceEl = $el.find('[data-testid="ad-price"]');
        const priceText = priceEl.text().trim();
        const price = extractPrice(priceText);
        
        const locationEl = $el.find('[data-testid="location-date"], .css-1a4brun');
        let location = locationEl.text().trim().split(' - ')[0] || params.location || "Portugal";
        
        const descriptionEl = $el.find('[data-cy="ad-card-description"], .css-1a4brun');
        const description = descriptionEl.text().trim() || title;
        
        const propertyType = extractPropertyType(title);
        const bedrooms = extractBedrooms(title);
        const area = extractArea(title + " " + description);
        
        const id = `olx-${Date.now()}-${index}`;
        
        properties.push({
          id,
          title,
          description,
          price,
          location,
          propertyType,
          bedrooms,
          area,
          source: "OLX",
          sourceUrl,
          sellerContact: {
            type: "private"
          },
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`[OLX] Error parsing property ${index}:`, err);
      }
    });
    
    if (properties.length === 0) {
      $('[data-testid="l-card"], .css-1venxj6').each((index, element) => {
        try {
          const $el = $(element);
          
          const title = $el.find('h6, h4').first().text().trim();
          if (!title) return;
          
          const linkEl = $el.find('a').first();
          const href = linkEl.attr('href');
          const sourceUrl = href ? (href.startsWith('http') ? href : `https://www.olx.pt${href}`) : '';
          
          const priceText = $el.find('p').filter((i, el) => $(el).text().includes('€')).first().text().trim();
          const price = extractPrice(priceText);
          
          const propertyType = extractPropertyType(title);
          const bedrooms = extractBedrooms(title);
          
          const id = `olx-${Date.now()}-${index}`;
          
          properties.push({
            id,
            title,
            description: title,
            price,
            location: params.location || "Portugal",
            propertyType,
            bedrooms,
            source: "OLX",
            sourceUrl,
            sellerContact: {
              type: "private"
            },
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.error(`[OLX] Error parsing property (alt) ${index}:`, err);
        }
      });
    }

    console.log(`[OLX] Found ${properties.length} properties via scraping`);
    return properties;
  } catch (error) {
    console.error("[OLX] Scraping error:", error);
    return [];
  }
}

export async function searchOLX(params: OLXSearchParams): Promise<OLXProperty[]> {
  try {
    const scrapedProperties = await scrapeOLX(params);
    
    if (scrapedProperties.length > 0) {
      console.log(`[OLX] Successfully scraped ${scrapedProperties.length} real properties`);
      
      if (params.propertyType) {
        const typeLower = params.propertyType.toLowerCase();
        return scrapedProperties.filter(p => 
          p.propertyType.toLowerCase().includes(typeLower)
        );
      }
      
      return scrapedProperties;
    }
    
    console.log("[OLX] No properties scraped, falling back to demo data");
  } catch (error) {
    console.error("[OLX] Search error, using demo data:", error);
  }
  
  console.log("[OLX] Using demo data");
  
  let filtered = [...OLX_DEMO_PROPERTIES];
  
  if (params.location) {
    const locationLower = params.location.toLowerCase();
    filtered = filtered.filter(p => 
      p.location.toLowerCase().includes(locationLower)
    );
  }
  
  if (params.propertyType) {
    const typeLower = params.propertyType.toLowerCase();
    filtered = filtered.filter(p => 
      p.propertyType.toLowerCase().includes(typeLower)
    );
  }
  
  if (params.minPrice) {
    filtered = filtered.filter(p => p.price >= params.minPrice!);
  }
  
  if (params.maxPrice) {
    filtered = filtered.filter(p => p.price <= params.maxPrice!);
  }
  
  return filtered;
}

export type { OLXSearchParams, OLXProperty };
