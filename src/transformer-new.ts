/**
 * Transform Sreality.cz data to StandardProperty format
 */

import { StandardProperty } from './core';
import { ParsedProperty } from './sreality-types';
import { config } from './config';

/**
 * Transform parsed Sreality property to StandardProperty format
 */
export function transformToStandard(parsed: ParsedProperty): StandardProperty {
  // Parse disposition (Czech format like "2+kk", "3+1")
  const dispositionInfo = parseDisposition(parsed.country_specific?.disposition);

  // Build standardized property
  const standard: StandardProperty = {
    // Basic info
    title: parsed.title,
    price: parsed.price || undefined,
    currency: parsed.currency,
    property_type: parsed.property_type,
    transaction_type: parsed.transaction_type,

    // Location
    location: {
      address: parsed.location.address,
      city: parsed.location.city,
      country: config.country,
      state: parsed.location.region,
      postal_code: parsed.location.postal_code,
      coordinates: parsed.location.coordinates,
    },

    // Details (standardized)
    details: {
      bedrooms: dispositionInfo.bedrooms || parsed.details.bedrooms,
      bathrooms: parsed.details.bathrooms,
      sqm: parsed.details.sqm,
      rooms: dispositionInfo.totalRooms || parsed.details.rooms,
    },

    // Features
    features: parsed.features,

    // Amenities (boolean flags)
    amenities: {
      has_parking: parsed.country_specific?.garaz || parsed.country_specific?.parkování !== undefined,
      has_balcony: (parsed.country_specific?.balkony || 0) > 0,
      has_garden: hasFeature(parsed.features, ['zahrada', 'garden']),
      has_pool: parsed.country_specific?.bazeny || false,
      has_elevator: parsed.country_specific?.vytah || false,
      has_cellar: parsed.country_specific?.sklep || false,
    },

    // Czech-specific fields (preserved as-is)
    country_specific: parsed.country_specific || {},

    // Media
    images: parsed.images,
    description: parsed.description,

    // Metadata
    url: parsed.url,
    status: 'active',
  };

  return standard;
}

/**
 * Parse Czech disposition format (e.g., "2+kk", "3+1")
 * Returns bedrooms and total rooms
 */
function parseDisposition(disposition?: string): {
  bedrooms: number | undefined;
  totalRooms: number | undefined;
  dispositionType: 'kk' | '1' | undefined;
} {
  if (!disposition) {
    return { bedrooms: undefined, totalRooms: undefined, dispositionType: undefined };
  }

  // Match patterns like "2+kk", "3+1", "1+kk"
  const match = disposition.match(/(\d+)\+(\d+|kk)/i);
  if (!match) {
    return { bedrooms: undefined, totalRooms: undefined, dispositionType: undefined };
  }

  const mainRooms = parseInt(match[1]);
  const kitchenPart = match[2].toLowerCase();

  let bedrooms: number;
  let totalRooms: number;
  let dispositionType: 'kk' | '1' | undefined;

  if (kitchenPart === 'kk') {
    // "kk" = kitchenette (counted as part of living space, not separate)
    bedrooms = mainRooms - 1; // Usually one room is living, rest are bedrooms
    totalRooms = mainRooms;
    dispositionType = 'kk';
  } else {
    // "+1" = separate kitchen
    const kitchenRooms = parseInt(kitchenPart);
    bedrooms = mainRooms - 1; // Usually one room is living, rest are bedrooms
    totalRooms = mainRooms + kitchenRooms;
    dispositionType = '1';
  }

  return {
    bedrooms: Math.max(bedrooms, 0),
    totalRooms,
    dispositionType,
  };
}

/**
 * Normalize Czech property types to standard types
 */
export function normalizePropertyType(czechType: string): string {
  const typeMap: Record<string, string> = {
    byt: 'apartment',
    dum: 'house',
    pozemek: 'land',
    'rodinny-dum': 'house',
    'komerci-prostor': 'commercial',
    'kancelare': 'commercial',
    'obchod': 'commercial',
    'vyrobni-prostor': 'commercial',
    'sklad': 'commercial',
    'zahrada': 'land',
    'pole': 'land',
    'les': 'land',
  };

  const normalized = typeMap[czechType.toLowerCase()];
  return normalized || 'other';
}

/**
 * Check if features array contains any of the keywords
 */
function hasFeature(features: string[], keywords: string[]): boolean {
  if (!features || features.length === 0) return false;

  const featureText = features.join(' ').toLowerCase();
  return keywords.some(keyword => featureText.includes(keyword.toLowerCase()));
}
