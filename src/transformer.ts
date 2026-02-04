/**
 * Transform SReality.cz data to StandardProperty format
 * Czech Republic's largest real estate portal
 */

import { SRealityListing } from './types.js';

/**
 * StandardProperty interface for Core Service API
 * This matches @landomo/core types
 */
export interface StandardProperty {
  title: string;
  price: number;
  currency: string;
  property_type: string;
  transaction_type: 'sale' | 'rent';
  source_url?: string;

  location: {
    address?: string;
    city: string;
    region?: string;
    country: string;
    postal_code?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };

  details: {
    bedrooms?: number;
    bathrooms?: number;
    sqm?: number;
    floor?: number;
    total_floors?: number;
    rooms?: number;
    year_built?: number;
  };

  images?: string[];
  videos?: string[];
  description?: string;
  description_language?: string;

  agent?: {
    name: string;
    phone?: string;
    email?: string;
    agency?: string;
  };

  features?: string[];
  amenities?: {
    has_parking?: boolean;
    has_garden?: boolean;
    has_balcony?: boolean;
    has_terrace?: boolean;
    has_pool?: boolean;
    has_elevator?: boolean;
    has_garage?: boolean;
    has_basement?: boolean;
    has_fireplace?: boolean;
    is_furnished?: boolean;
    is_new_construction?: boolean;
    is_luxury?: boolean;
  };

  energy_rating?: string;
  price_per_sqm?: number;

  // Czech-specific fields preserved in country_specific
  country_specific?: Record<string, any>;

  status?: 'active' | 'removed' | 'sold' | 'rented';
}

/**
 * Transform SReality listing to StandardProperty format
 */
export function transformToStandard(raw: SRealityListing): StandardProperty {
  // Parse disposition (Czech format: 2+kk, 3+1, etc.)
  const dispositionInfo = parseDisposition(raw.title, raw.details.rooms);

  return {
    title: raw.title,
    price: raw.price || 0,
    currency: raw.currency,
    property_type: normalizePropertyType(raw.listing.category),
    transaction_type: raw.listing.type,
    source_url: raw.url,

    location: {
      address: raw.location.address,
      city: raw.location.city || 'Unknown',
      region: raw.location.region,
      country: 'Czech Republic',
      postal_code: raw.location.zipCode,
      coordinates: (raw.location.latitude && raw.location.longitude) ? {
        lat: raw.location.latitude,
        lon: raw.location.longitude
      } : undefined
    },

    details: {
      bedrooms: dispositionInfo.bedrooms,
      bathrooms: raw.details.bathrooms,
      sqm: raw.details.sqm,
      floor: parseFloor(raw.details.floor),
      total_floors: parseFloor(raw.details.totalFloors),
      rooms: raw.details.rooms,
      year_built: raw.details.buildYear
    },

    images: raw.images || [],
    description: raw.description,
    description_language: 'cs',

    agent: raw.agent ? {
      name: raw.agent.name || 'Unknown',
      phone: raw.agent.phone,
      email: raw.agent.email,
      agency: raw.agent.agency
    } : undefined,

    features: standardizeFeatures(raw.features),

    amenities: {
      has_parking: hasFeature(raw.features, ['parking', 'garážové stání', 'parkování']),
      has_balcony: hasFeature(raw.features, ['balcony', 'balkon']),
      has_terrace: hasFeature(raw.features, ['terrace', 'terasa']),
      has_garden: hasFeature(raw.features, ['garden', 'zahrada']),
      has_pool: hasFeature(raw.features, ['pool', 'bazén']),
      has_elevator: hasFeature(raw.features, ['elevator', 'výtah']),
      has_basement: hasFeature(raw.features, ['basement', 'sklep']),
      has_garage: hasFeature(raw.features, ['garage', 'garáž']),
      is_furnished: hasFeature(raw.features, ['furnished', 'vybavený', 'zařízený'])
    },

    price_per_sqm: raw.pricePerSqm,

    // Czech-specific fields
    country_specific: {
      // Disposition format (2+kk, 3+1, etc.)
      disposition: dispositionInfo.disposition,
      disposition_type: dispositionInfo.dispositionType,

      // Ownership type (Osobní = Personal, Družstevní = Cooperative)
      vlastnictvi: extractOwnership(raw.features, raw.description),

      // Building type (Panel, Cihlová = Brick, etc.)
      stavba: raw.details.buildType,

      // Condition (Dobrý = Good, Velmi dobrý = Very good, Po rekonstrukci = After reconstruction)
      stav: raw.details.condition,

      // Additional Czech fields
      district: raw.location.district,
      floor_info: raw.details.floor,
      total_floors_info: raw.details.totalFloors,

      // Agent info
      agent_type: raw.agent?.type,
      agent_rating: raw.agent?.rating,

      // Listing metadata
      posted_at: raw.listing.postedAt,
      updated_at: raw.listing.updatedAt,
      featured: raw.listing.featured,
      promoted: raw.listing.promoted
    },

    status: 'active'
  };
}

/**
 * Parse Czech disposition format (2+kk, 3+1, etc.)
 *
 * Format explanation:
 * - 2+kk = 2 rooms + kitchenette (bedroom + living with kitchen corner)
 * - 2+1 = 2 rooms + separate kitchen (bedroom + living + kitchen)
 * - 3+kk = 3 rooms + kitchenette
 * - 3+1 = 3 rooms + separate kitchen
 */
function parseDisposition(title: string, rooms?: number): {
  disposition?: string;
  dispositionType?: string;
  bedrooms?: number;
} {
  // Try to extract disposition from title
  const dispositionMatch = title.match(/(\d+)\s*\+\s*(kk|1)/i);

  if (dispositionMatch) {
    const mainRooms = parseInt(dispositionMatch[1], 10);
    const kitchenType = dispositionMatch[2].toLowerCase();

    // Calculate bedrooms (in Czech format, main rooms include bedroom + living)
    // For 2+kk: typically 1 bedroom (other room is living)
    // For 3+kk: typically 2 bedrooms (one room is living)
    const bedrooms = mainRooms > 1 ? mainRooms - 1 : 1;

    return {
      disposition: `${mainRooms}+${kitchenType}`,
      dispositionType: kitchenType,
      bedrooms
    };
  }

  // Fallback to rooms if no disposition found
  if (rooms) {
    // Estimate bedrooms from total rooms
    const bedrooms = rooms > 1 ? Math.floor(rooms / 2) : 1;

    return {
      bedrooms
    };
  }

  return {};
}

/**
 * Extract ownership type from features/description
 * Common types: Osobní (Personal), Družstevní (Cooperative), Státní (State)
 */
function extractOwnership(features: string[], description?: string): string | undefined {
  const ownershipKeywords = [
    { keyword: 'osobní', type: 'Osobní' },
    { keyword: 'družstevní', type: 'Družstevní' },
    { keyword: 'státní', type: 'Státní' },
    { keyword: 'personal', type: 'Osobní' },
    { keyword: 'cooperative', type: 'Družstevní' }
  ];

  // Check features
  for (const feature of features) {
    const lowerFeature = feature.toLowerCase();
    for (const { keyword, type } of ownershipKeywords) {
      if (lowerFeature.includes(keyword)) {
        return type;
      }
    }
  }

  // Check description
  if (description) {
    const lowerDesc = description.toLowerCase();
    for (const { keyword, type } of ownershipKeywords) {
      if (lowerDesc.includes(keyword)) {
        return type;
      }
    }
  }

  return undefined;
}

/**
 * Parse floor from string to number
 */
function parseFloor(floor?: string): number | undefined {
  if (!floor) return undefined;

  const floorStr = String(floor).toLowerCase();

  // Handle special cases
  if (floorStr.includes('přízemí') || floorStr.includes('ground')) {
    return 0;
  }

  // Extract number
  const match = floorStr.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  return undefined;
}

/**
 * Normalize property type to standard values
 */
function normalizePropertyType(category?: string): string {
  if (!category) return 'other';

  const typeMap: Record<string, string> = {
    'apartment': 'apartment',
    'byt': 'apartment',
    'house': 'house',
    'dům': 'house',
    'rodinný dům': 'house',
    'land': 'land',
    'pozemek': 'land',
    'commercial': 'commercial',
    'komerční': 'commercial',
    'office': 'commercial',
    'kancelář': 'commercial'
  };

  const normalized = category.toLowerCase().trim();
  return typeMap[normalized] || 'other';
}

/**
 * Standardize feature names
 */
function standardizeFeatures(features: string[]): string[] {
  if (!features || features.length === 0) return [];

  const featureMap: Record<string, string> = {
    // Czech → English
    'balkon': 'balcony',
    'terasa': 'terrace',
    'zahrada': 'garden',
    'bazén': 'pool',
    'výtah': 'elevator',
    'sklep': 'basement',
    'garáž': 'garage',
    'parkování': 'parking',
    'klimatizace': 'air_conditioning',
    'alarm': 'alarm',
    'secured door': 'security_door',
    'security': 'security',
    'vybavený': 'furnished',
    'zařízený': 'furnished',

    // English variants
    'air conditioning': 'air_conditioning',
    'parking': 'parking',
    'balcony': 'balcony',
    'terrace': 'terrace',
    'garden': 'garden',
    'pool': 'pool',
    'elevator': 'elevator',
    'basement': 'basement',
    'garage': 'garage',
    'furnished': 'furnished'
  };

  return features.map(f => {
    const normalized = f.toLowerCase().trim();
    return featureMap[normalized] || normalized.replace(/\s+/g, '_');
  });
}

/**
 * Check if listing has a specific feature
 */
function hasFeature(features: string[], keywords: string[]): boolean {
  if (!features || features.length === 0) return false;

  return features.some(f => {
    const lowerFeature = f.toLowerCase();
    return keywords.some(keyword => lowerFeature.includes(keyword.toLowerCase()));
  });
}

/**
 * Create IngestionPayload for Core Service API
 */
export function createIngestionPayload(
  portalId: string,
  listing: SRealityListing
): {
  portal: string;
  portal_id: string;
  country: string;
  data: StandardProperty;
  raw_data: SRealityListing;
} {
  return {
    portal: 'sreality',
    portal_id: portalId,
    country: 'czech',
    data: transformToStandard(listing),
    raw_data: listing
  };
}
