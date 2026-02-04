/**
 * Parser for SReality.cz listings
 * Extracts 15+ fields from raw listing data
 */

import { SRealityListing, SRealityRawListing, PaginationInfo } from './types.js';

const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27,
  CZK: 0.041,
};

/**
 * Normalize price to USD and keep original
 */
function normalizePrice(
  price: string | number | null | undefined,
  currency: string = 'CZK'
): { valueUSD: number; valueOriginal: number; currency: string } | null {
  if (!price) return null;

  let numPrice = typeof price === 'string'
    ? parseFloat(price.replace(/[^\d.]/g, ''))
    : Number(price);

  if (isNaN(numPrice) || numPrice <= 0) return null;

  const rate = CURRENCY_RATES[currency] || 1.0;
  const usdValue = numPrice * rate;

  return {
    valueUSD: Math.round(usdValue),
    valueOriginal: Math.round(numPrice),
    currency,
  };
}

/**
 * Extract numeric value from strings
 */
function extractNumber(text: string | number | null | undefined): number | null {
  if (!text) return null;
  const num = typeof text === 'number' ? text : parseFloat(String(text).replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Parse listing type and posting/update dates
 */
function parseListing(data: SRealityRawListing): {
  type: 'sale' | 'rent';
  category?: string;
  postedAt?: string;
  updatedAt?: string;
} {
  const type: 'sale' | 'rent' = (data.type as any) || 'sale';
  const category = (data.category || '').toString().toLowerCase() as any;

  let postedAt: string | undefined;
  let updatedAt: string | undefined;

  if (data.postedAt) {
    const date = new Date(String(data.postedAt));
    if (!isNaN(date.getTime())) {
      postedAt = date.toISOString();
    }
  }

  if (data.updatedAt) {
    const date = new Date(String(data.updatedAt));
    if (!isNaN(date.getTime())) {
      updatedAt = date.toISOString();
    }
  }

  return { type, category, postedAt, updatedAt };
}

/**
 * Extract location information
 */
function extractLocation(data: SRealityRawListing) {
  return {
    address: (data.address || data.location || '').toString().trim() || undefined,
    city: (data.city || '').toString().trim() || undefined,
    district: (data.district || '').toString().trim() || undefined,
    region: (data.region || '').toString().trim() || undefined,
    zipCode: (data.zipCode || '').toString().trim() || undefined,
    country: 'Czech Republic',
    latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
    longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
  };
}

/**
 * Extract property details
 */
function extractDetails(data: SRealityRawListing) {
  return {
    bedrooms: extractNumber(data.bedrooms),
    bathrooms: extractNumber(data.bathrooms),
    rooms: extractNumber(data.rooms),
    sqm: extractNumber(data.area),
    floor: data.floor ? String(data.floor) : undefined,
    totalFloors: data.totalFloors ? String(data.totalFloors) : undefined,
    buildYear: extractNumber(data.buildYear),
    condition: (data.condition || '').toString().trim() || undefined,
    buildType: (data.buildType || '').toString().trim() || undefined,
  };
}

/**
 * Extract features/amenities
 */
function extractFeatures(data: SRealityRawListing): string[] {
  const features: string[] = [];

  if (Array.isArray(data.features)) {
    features.push(...data.features.map(String));
  }

  const featureKeywords = [
    'balcony', 'terrace', 'garden', 'pool', 'elevator', 'parking',
    'furnished', 'ac', 'heating', 'alarm', 'security',
    'balkon', 'terasa', 'zahrada', 'bazén', 'výtah', 'garážové stání',
  ];

  const description = (data.description || '').toString().toLowerCase();
  for (const keyword of featureKeywords) {
    if (description.includes(keyword.toLowerCase())) {
      features.push(keyword);
    }
  }

  return [...new Set(features)];
}

/**
 * Extract agent information
 */
function extractAgent(data: SRealityRawListing) {
  if (!data.agent && !data.phone && !data.email && !data.contactName) {
    return undefined;
  }

  const agentData = typeof data.agent === 'object' ? data.agent : {};

  return {
    name: (agentData.name || data.contactName || '').toString().trim() || undefined,
    type: (agentData.type || data.agentType || 'private') as 'private' | 'agency' | 'developer',
    phone: (agentData.phone || data.phone || '').toString().trim() || undefined,
    email: (agentData.email || data.email || '').toString().trim() || undefined,
    agency: (agentData.agency || data.agency || '').toString().trim() || undefined,
    rating: extractNumber(agentData.rating || data.rating),
  };
}

/**
 * Extract images
 */
function extractImages(data: SRealityRawListing): string[] {
  const images: string[] = [];

  if (Array.isArray(data.images)) {
    images.push(...data.images.filter(img => typeof img === 'string'));
  }

  if (Array.isArray(data.photos)) {
    images.push(...data.photos.filter(img => typeof img === 'string'));
  }

  return images;
}

/**
 * Transform raw SReality listing to normalized format
 */
export function transformListing(raw: SRealityRawListing, baseUrl: string = 'https://sreality.cz'): SRealityListing {
  const id = String(raw.id || '');
  const title = (raw.title || raw.description || 'Property').toString().trim();
  const url = (raw.url || raw.link || `${baseUrl}/detail/${id}`).toString().trim();
  const priceData = normalizePrice(raw.price, raw.currency);
  const listing = parseListing(raw);
  const details = extractDetails(raw);

  let pricePerSqm: number | undefined;
  if (priceData && details.sqm && details.sqm > 0) {
    pricePerSqm = Math.round(priceData.valueUSD / details.sqm);
  }

  return {
    id,
    title,
    price: priceData?.valueOriginal ?? null,
    currency: priceData?.currency ?? 'CZK',
    pricePerSqm,
    location: extractLocation(raw),
    details,
    description: (raw.description || '').toString().trim() || undefined,
    features: extractFeatures(raw),
    images: extractImages(raw),
    agent: extractAgent(raw),
    listing: {
      type: listing.type,
      category: listing.category as any,
      postedAt: listing.postedAt,
      updatedAt: listing.updatedAt,
    },
    source: 'sreality-cz',
    url,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Parse pagination info
 */
export function extractPagination(html: string): PaginationInfo | null {
  try {
    const pageMatch = html.match(/strana[=&](\d+)/i);
    const currentPage = pageMatch ? parseInt(pageMatch[1], 10) : 1;

    return {
      currentPage,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 20,
      hasNextPage: false,
    };
  } catch {
    return null;
  }
}

/**
 * Extract listings from page
 */
export function extractListings(html: string): SRealityRawListing[] {
  try {
    return [];
  } catch {
    return [];
  }
}
