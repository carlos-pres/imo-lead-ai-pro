const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

export interface ApifyProperty {
  id: string;
  title: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  contact: string;
  contactName: string;
  email?: string;
  source: string;
  url?: string;
  description?: string;
  features?: string[];
  images?: string[];
  publishedAt?: string;
}

interface ApifySearchParams {
  location?: string;
  propertyType?: string;
  operation?: "sale" | "rent";
  minPrice?: number;
  maxPrice?: number;
  maxItems?: number;
}

interface ApifyRawListing {
  url?: string;
  title?: string;
  price?: number | string;
  pricePerSquareMeter?: number;
  location?: string;
  address?: string;
  province?: string;
  district?: string;
  municipality?: string;
  neighborhood?: string;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  area?: number;
  floor?: string;
  description?: string;
  features?: string[];
  images?: string[];
  agency?: string;
  agencyPhone?: string;
  agencyUrl?: string;
  contactPhone?: string;
  contactName?: string;
  phone?: string;
  propertyType?: string;
  publishedAt?: string;
  datePublished?: string;
  id?: string;
  externalId?: string;
}

function formatPrice(price: number | string | undefined): string {
  if (!price) return "Sob consulta";
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^0-9.-]/g, "")) : price;
  if (isNaN(numPrice)) return "Sob consulta";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(numPrice);
}

function normalizePropertyType(type: string | undefined): string {
  if (!type) return "Outro";
  const typeMap: Record<string, string> = {
    flat: "Apartamento",
    apartment: "Apartamento",
    apartamento: "Apartamento",
    piso: "Apartamento",
    house: "Moradia",
    moradia: "Moradia",
    villa: "Moradia",
    chalet: "Moradia",
    countryhouse: "Moradia",
    vivenda: "Moradia",
    duplex: "Apartamento",
    penthouse: "Apartamento",
    atico: "Apartamento",
    studio: "Apartamento",
    estudio: "Apartamento",
    land: "Terreno",
    terreno: "Terreno",
    premises: "Comercial",
    office: "Comercial",
    loja: "Comercial",
    escritorio: "Comercial",
    garage: "Garagem",
    garagem: "Garagem",
    storageroom: "Arrecadação",
    arrecadacao: "Arrecadação",
  };
  return typeMap[type.toLowerCase().replace(/\s/g, "").replace(/á/g, "a").replace(/ã/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u")] || type;
}

function convertApifyToProperty(listing: ApifyRawListing, source: string): ApifyProperty {
  const phone = listing.contactPhone || listing.agencyPhone || listing.phone || "";
  const contactName = listing.contactName || listing.agency || "Proprietário";
  const location = listing.location || listing.address || listing.municipality || listing.neighborhood || listing.district || listing.province || "Portugal";
  
  return {
    id: listing.id || listing.externalId || `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: listing.title || `Imóvel em ${location}`,
    price: formatPrice(listing.price),
    location: location,
    propertyType: normalizePropertyType(listing.propertyType),
    bedrooms: listing.bedrooms || listing.rooms,
    bathrooms: listing.bathrooms,
    area: listing.area || listing.size,
    contact: phone,
    contactName: contactName,
    email: "",
    source: source,
    url: listing.url,
    description: listing.description,
    features: listing.features,
    images: listing.images,
    publishedAt: listing.publishedAt || listing.datePublished,
  };
}

// Scrapers ordenados por prioridade - gratuitos primeiro para contas básicas
// apify/cheerio-scraper = Gratuito, funciona para sites estáticos
// apify/web-scraper = Gratuito, usa Puppeteer para sites com JavaScript
const IDEALISTA_SCRAPERS = [
  { id: "apify/cheerio-scraper", name: "Cheerio Generic (Free)", inputType: "cheerio" },
  { id: "apify/web-scraper", name: "Web Scraper Puppeteer (Free)", inputType: "puppeteer" },
];

// Imovirtual - usar web-scraper que suporta JavaScript
const IMOVIRTUAL_SCRAPERS = [
  { id: "apify/web-scraper", name: "Web Scraper Puppeteer (Free)", inputType: "puppeteer" },
  { id: "apify/cheerio-scraper", name: "Cheerio Generic (Free)", inputType: "cheerio" },
];

// Supercasa - usar web-scraper que suporta JavaScript
const SUPERCASA_SCRAPERS = [
  { id: "apify/web-scraper", name: "Web Scraper Puppeteer (Free)", inputType: "puppeteer" },
  { id: "apify/cheerio-scraper", name: "Cheerio Generic (Free)", inputType: "cheerio" },
];

async function tryScraperWithTimeout(
  actorId: string,
  input: Record<string, any>,
  timeoutMs: number = 90000
): Promise<ApifyRawListing[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const apiActorId = actorId.replace("/", "~");
    console.log(`[Apify] Trying ${actorId}...`);
    
    const response = await fetch(
      `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Apify] ${actorId} failed: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[Apify] ${actorId} returned ${data.length} items`);
      return data;
    }
    
    console.log(`[Apify] ${actorId} returned empty/invalid data`);
    return null;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.log(`[Apify] ${actorId} timeout`);
    } else {
      console.log(`[Apify] ${actorId} error: ${error.message}`);
    }
    return null;
  }
}

// Script para extrair dados de listagem do Idealista usando Cheerio
const IDEALISTA_CHEERIO_PAGE_FUNCTION = `
async function pageFunction(context) {
  const { $, request, log } = context;
  const results = [];
  
  $('article.item').each((i, el) => {
    const $el = $(el);
    const title = $el.find('.item-link').text().trim();
    const priceText = $el.find('.item-price').text().trim();
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    const url = 'https://www.idealista.pt' + $el.find('.item-link').attr('href');
    const details = $el.find('.item-detail').text();
    const rooms = parseInt(details.match(/(\\d+)\\s*quarto/i)?.[1]) || undefined;
    const size = parseInt(details.match(/(\\d+)\\s*m²/)?.[1]) || undefined;
    const location = $el.find('.item-detail-char .item-detail').first().text().trim();
    
    if (title && price > 0) {
      results.push({
        title,
        price,
        url,
        rooms,
        size,
        location: location || request.url.split('/').slice(-2, -1)[0],
        source: 'Idealista'
      });
    }
  });
  
  return results;
}
`;

async function searchIdealista(params: ApifySearchParams): Promise<ApifyProperty[]> {
  const location = params.location?.toLowerCase() || "lisboa";
  const propertyTypeMap: Record<string, string> = {
    apartamento: "apartamentos",
    moradia: "casas",
    terreno: "terrenos",
    comercial: "locais-comerciais",
  };
  const propertyPath = propertyTypeMap[params.propertyType?.toLowerCase() || ""] || "casas";
  const operation = params.operation === "rent" ? "arrendar" : "comprar";
  const searchUrl = `https://www.idealista.pt/${operation}-${propertyPath}/${location}/`;
  
  console.log(`[Apify] Idealista search URL: ${searchUrl}`);
  
  for (const scraper of IDEALISTA_SCRAPERS) {
    let input: Record<string, any>;
    
    if (scraper.inputType === "cheerio") {
      input = {
        startUrls: [{ url: searchUrl }],
        pageFunction: IDEALISTA_CHEERIO_PAGE_FUNCTION,
        maxCrawlingDepth: 0,
        maxRequestsPerCrawl: 5,
      };
    } else if (scraper.inputType === "puppeteer") {
      // Web Scraper com Puppeteer - executa JavaScript
      input = {
        startUrls: [{ url: searchUrl }],
        pageFunction: `async function pageFunction(context) {
          const { page, request, log } = context;
          await page.waitForSelector('article.item', { timeout: 10000 }).catch(() => {});
          const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('article.item').forEach(el => {
              const title = el.querySelector('.item-link')?.textContent?.trim() || '';
              const priceText = el.querySelector('.item-price')?.textContent?.trim() || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
              const href = el.querySelector('.item-link')?.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : 'https://www.idealista.pt' + href;
              const details = el.querySelector('.item-detail')?.textContent || '';
              const rooms = parseInt(details.match(/(\\d+)\\s*quarto/i)?.[1]) || undefined;
              const size = parseInt(details.match(/(\\d+)\\s*m²/)?.[1]) || undefined;
              if (title && price > 0) {
                items.push({ title, price, url, rooms, size, source: 'Idealista' });
              }
            });
            return items;
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        maxConcurrency: 2,
      };
    } else {
      input = { 
        startUrls: [searchUrl], 
        maxItems: params.maxItems || 30,
        country: "pt",
      };
    }
    
    const data = await tryScraperWithTimeout(scraper.id, input, 180000);
    if (data && data.length > 0) {
      console.log(`[Apify] ${scraper.id} returned ${data.length} items`);
      const properties = data.map((item: any) => {
        const enhanced: ApifyRawListing = {
          ...item,
          title: item.title || item.propertyTitle || item.name || `Imóvel em ${item.location || location}`,
          price: item.price || item.priceInfo?.price || item.priceAmount,
          location: item.location || item.address || item.neighborhood || item.zone || location,
          contactPhone: item.contactInfo?.phone || item.phone || item.contactPhone || item.agencyPhone,
          contactName: item.contactInfo?.name || item.agency || item.contactName || item.agencyName || "Proprietário",
          propertyType: item.propertyType || item.typology || params.propertyType,
          rooms: item.rooms || item.bedrooms || item.numberOfRooms,
          bathrooms: item.bathrooms || item.numberOfBathrooms,
          size: item.size || item.floorSize || item.area || item.usefulArea,
          description: item.description || item.propertyDescription || item.features?.join(", "),
          url: item.url || item.link || item.propertyUrl,
        };
        return convertApifyToProperty(enhanced, "Idealista");
      });
      return properties;
    }
  }
  
  console.log("[Apify] All Idealista scrapers failed");
  return [];
}

async function searchImovirtual(params: ApifySearchParams): Promise<ApifyProperty[]> {
  const location = params.location || "lisboa";
  const locationCapitalized = location.charAt(0).toUpperCase() + location.slice(1).toLowerCase();
  
  const propertyTypeMap: Record<string, string> = {
    apartamento: "apartamento",
    moradia: "moradia",
    terreno: "terreno",
    comercial: "comercial",
  };
  
  const operation = params.operation === "rent" ? "arrendamento" : "venda";
  const propertyType = propertyTypeMap[params.propertyType?.toLowerCase() || ""] || "apartamento";
  const imovirtualUrl = `https://www.imovirtual.com/${operation}/${propertyType}/${location}/`;
  
  console.log(`[Apify] Imovirtual search URL: ${imovirtualUrl}`);
  
  for (const scraper of IMOVIRTUAL_SCRAPERS) {
    let input: Record<string, any>;
    
    if (scraper.inputType === "puppeteer") {
      // Web Scraper com Puppeteer para sites com JavaScript
      input = {
        startUrls: [{ url: imovirtualUrl }],
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          await page.waitForSelector('[data-cy="listing-item"], article, .offer-item', { timeout: 15000 }).catch(() => {});
          const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('[data-cy="listing-item"], article[data-featured-name], .offer-item').forEach(el => {
              const title = el.querySelector('[data-cy="listing-item-title"], h3, h2, .title')?.textContent?.trim() || '';
              const priceText = el.querySelector('[data-cy="ad-price"], .price, [class*="price"]')?.textContent?.trim() || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
              const linkEl = el.querySelector('a[href*="/anuncio/"], a[href*="/imovel/"], a');
              const href = linkEl?.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : 'https://www.imovirtual.com' + href;
              const location = el.querySelector('[data-cy="listing-item-location"], .location, [class*="location"]')?.textContent?.trim() || '';
              if (title && price > 0) {
                items.push({ title, price, url, location, source: 'Imovirtual' });
              }
            });
            return items;
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        maxConcurrency: 2,
      };
    } else if (scraper.inputType === "cheerio") {
      input = {
        startUrls: [{ url: imovirtualUrl }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const results = [];
          $('[data-cy="listing-item"], article[data-featured-name], .offer-item, .listing-item').each((i, el) => {
            const $el = $(el);
            const title = $el.find('[data-cy="listing-item-title"], .offer-item-title, h3, h2').first().text().trim();
            const priceText = $el.find('[data-cy="ad-price"], .offer-item-price, .price').first().text().trim();
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            const linkEl = $el.find('a[href*="/anuncio/"], a[href*="/imovel/"]').first();
            const url = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
            const location = $el.find('[data-cy="listing-item-location"], .offer-item-location, .location').text().trim();
            if (title && price > 0) {
              results.push({ title, price, url: url.startsWith('http') ? url : 'https://www.imovirtual.com' + url, location, source: 'Imovirtual' });
            }
          });
          return results;
        }`,
        maxCrawlingDepth: 0,
        maxRequestsPerCrawl: 5,
      };
    } else {
      input = {
        location: locationCapitalized,
        propertyType: propertyType,
        transactionType: params.operation === "rent" ? "arrendar" : "comprar",
        maxPages: 5,
      };
      if (params.minPrice) input.minPrice = params.minPrice;
      if (params.maxPrice) input.maxPrice = params.maxPrice;
    }
    
    const data = await tryScraperWithTimeout(scraper.id, input, 120000);
    if (data && data.length > 0) {
      const properties = data.map((item: any) => {
        const enhanced: ApifyRawListing = {
          ...item,
          title: item.title || `${item.propertyType || 'Imóvel'} em ${item.location || locationCapitalized}`,
          price: item.price,
          location: item.full_address || item.location || locationCapitalized,
          contactPhone: item.agency_phone || item.phone,
          contactName: item.agency_name || "Proprietário",
          propertyType: item.propertyType || params.propertyType,
          rooms: item.rooms_number ? parseInt(item.rooms_number) : undefined,
          size: item.area_square_meter,
        };
        return convertApifyToProperty(enhanced, "Imovirtual");
      });
      return properties;
    }
  }
  
  console.log("[Apify] All Imovirtual scrapers failed");
  return [];
}

async function searchSupercasa(params: ApifySearchParams): Promise<ApifyProperty[]> {
  const location = params.location?.toLowerCase() || "lisboa";
  
  const propertyTypeMap: Record<string, string> = {
    apartamento: "apartamentos",
    moradia: "moradias",
    terreno: "terrenos",
  };
  
  const operation = params.operation === "rent" ? "arrendar" : "comprar";
  const propertyType = propertyTypeMap[params.propertyType?.toLowerCase() || ""] || "apartamentos";
  const supercasaUrl = `https://supercasa.pt/${operation}-${propertyType}/${location}`;
  
  console.log(`[Apify] Supercasa search URL: ${supercasaUrl}`);
  
  for (const scraper of SUPERCASA_SCRAPERS) {
    let input: Record<string, any>;
    
    if (scraper.inputType === "puppeteer") {
      // Web Scraper com Puppeteer para sites com JavaScript
      input = {
        startUrls: [{ url: supercasaUrl }],
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          await page.waitForSelector('[class*="property"], article, .result-item', { timeout: 15000 }).catch(() => {});
          const results = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('[class*="property-item"], [class*="listing-item"], article, .result-item').forEach(el => {
              const title = el.querySelector('[class*="title"], h2, h3')?.textContent?.trim() || '';
              const priceText = el.querySelector('[class*="price"]')?.textContent?.trim() || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
              const linkEl = el.querySelector('a[href*="/imovel/"], a[href*="/property/"], a');
              const href = linkEl?.getAttribute('href') || '';
              const url = href.startsWith('http') ? href : 'https://supercasa.pt' + href;
              const location = el.querySelector('[class*="location"], [class*="address"]')?.textContent?.trim() || '';
              if (title && price > 0) {
                items.push({ title, price, url, location, source: 'Supercasa' });
              }
            });
            return items;
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        maxConcurrency: 2,
      };
    } else if (scraper.inputType === "cheerio") {
      input = {
        startUrls: [{ url: supercasaUrl }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const results = [];
          $('[class*="property"], [class*="listing"], article, .result-item').each((i, el) => {
            const $el = $(el);
            const title = $el.find('[class*="title"], h2, h3').first().text().trim();
            const priceText = $el.find('[class*="price"]').first().text().trim();
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            const linkEl = $el.find('a[href*="/imovel/"], a[href*="/property/"]').first();
            const url = linkEl.attr('href') || $el.find('a').first().attr('href') || '';
            const location = $el.find('[class*="location"], [class*="address"]').text().trim();
            if (title && price > 0) {
              results.push({ title, price, url: url.startsWith('http') ? url : 'https://supercasa.pt' + url, location, source: 'Supercasa' });
            }
          });
          return results;
        }`,
        maxCrawlingDepth: 0,
        maxRequestsPerCrawl: 5,
      };
    } else {
      input = {
        startUrls: [supercasaUrl],
        maxItems: params.maxItems || 30,
      };
    }
    
    const data = await tryScraperWithTimeout(scraper.id, input, 120000);
    if (data && data.length > 0) {
      const properties = data.map((item: any) => {
        const enhanced: ApifyRawListing = {
          ...item,
          title: item.title || item.name || `Imóvel em ${item.location || location}`,
          price: item.price,
          location: item.location || item.address || location,
          contactPhone: item.phone || item.contactPhone,
          contactName: item.agency || item.agencyName || "Proprietário",
          propertyType: item.propertyType || params.propertyType,
          rooms: item.rooms || item.bedrooms,
          bathrooms: item.bathrooms,
          size: item.size || item.area,
        };
        return convertApifyToProperty(enhanced, "Supercasa");
      });
      return properties;
    }
  }
  
  console.log("[Apify] All Supercasa scrapers failed");
  return [];
}

function generateDemoLeads(params: ApifySearchParams): ApifyProperty[] {
  const location = params.location || "Lisboa";
  const propertyType = params.propertyType || "Apartamento";
  const now = Date.now();
  
  const neighborhoods = ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Belém", "Parque das Nações", "Alcântara", "Estrela"];
  const agencies = ["Remax Portugal", "ERA Imobiliária", "Century 21", "Coldwell Banker", "KW Portugal", "Engel & Völkers"];
  const contacts = ["912 345 678", "934 567 890", "961 234 567", "915 678 901", "923 456 789"];
  
  const demoLeads: ApifyProperty[] = [];
  const count = Math.min(params.maxItems || 10, 15);
  
  for (let i = 0; i < count; i++) {
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const agency = agencies[Math.floor(Math.random() * agencies.length)];
    const contact = contacts[Math.floor(Math.random() * contacts.length)];
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const area = 50 + Math.floor(Math.random() * 150);
    const pricePerM2 = 3000 + Math.floor(Math.random() * 4000);
    const price = area * pricePerM2;
    
    demoLeads.push({
      id: `demo-${now}-${i}`,
      title: `${propertyType} T${bedrooms} em ${neighborhood}, ${location}`,
      price: formatPrice(price),
      location: `${neighborhood}, ${location}`,
      propertyType: propertyType,
      bedrooms: bedrooms,
      bathrooms: Math.max(1, Math.floor(bedrooms / 2)),
      area: area,
      contact: contact,
      contactName: agency,
      email: "",
      source: "Demo",
      url: `https://www.idealista.pt/imovel/${now}${i}/`,
      description: `Excelente ${propertyType.toLowerCase()} com ${bedrooms} quartos e ${area}m² em ${neighborhood}. Ótima localização, perto de transportes e serviços.`,
      features: ["Elevador", "Varanda", "Cozinha equipada", "Ar condicionado"],
      publishedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return demoLeads;
}

export async function searchWithApify(
  params: ApifySearchParams,
  source: "idealista" | "supercasa" | "imovirtual" | "all" = "all"
): Promise<{ listings: ApifyProperty[]; error?: string; usedDemo?: boolean }> {
  if (!APIFY_API_TOKEN) {
    console.log("[Apify] No API token - using demo leads");
    return { 
      listings: generateDemoLeads(params), 
      error: "APIFY_API_TOKEN não configurado - usando dados de demonstração",
      usedDemo: true 
    };
  }

  const allListings: ApifyProperty[] = [];
  const errors: string[] = [];
  
  const searchFunctions = {
    idealista: () => searchIdealista(params),
    imovirtual: () => searchImovirtual(params),
    supercasa: () => searchSupercasa(params),
  };
  
  const sources = source === "all" 
    ? ["idealista", "imovirtual", "supercasa"] as const
    : [source] as const;
  
  for (const src of sources) {
    try {
      const results = await searchFunctions[src]();
      if (results.length > 0) {
        allListings.push(...results);
        console.log(`[Apify] Found ${results.length} from ${src}`);
      } else {
        errors.push(`${src}: sem resultados`);
      }
    } catch (error: any) {
      console.error(`[Apify] Error in ${src}:`, error.message);
      errors.push(`${src}: ${error.message}`);
    }
  }
  
  if (allListings.length === 0) {
    console.log("[Apify] No real leads found - using demo leads as fallback");
    return { 
      listings: generateDemoLeads(params), 
      error: errors.join("; ") + " - usando dados de demonstração",
      usedDemo: true 
    };
  }

  return {
    listings: allListings,
    error: errors.length > 0 ? errors.join("; ") : undefined,
    usedDemo: false,
  };
}

export async function runScheduledSearch(customerId: string, params?: ApifySearchParams): Promise<{ 
  totalFound: number; 
  sources: { source: string; count: number }[];
  listings: ApifyProperty[];
  usedDemo?: boolean;
}> {
  console.log(`[Apify] Running scheduled search for customer ${customerId}`);
  
  const result = await searchWithApify({
    operation: "sale",
    maxItems: params?.maxItems || 30,
    location: params?.location || "lisboa",
    ...params,
  }, "all");

  const sourceCount: Record<string, number> = {};
  for (const listing of result.listings) {
    const src = listing.source || "Unknown";
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  }

  return {
    totalFound: result.listings.length,
    sources: Object.entries(sourceCount).map(([source, count]) => ({ source, count })),
    listings: result.listings,
    usedDemo: result.usedDemo,
  };
}

export function isApifyConfigured(): boolean {
  return !!APIFY_API_TOKEN;
}

export { generateDemoLeads };
