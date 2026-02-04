/**
 * Type definitions for SReality.cz scraper
 * Czech Republic's largest real estate portal
 */

export interface SRealityListing {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  pricePerSqm?: number;
  location: {
    address?: string;
    city?: string;
    district?: string;
    region?: string;
    zipCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  details: {
    bedrooms?: number;
    bathrooms?: number;
    rooms?: number;
    sqm?: number;
    floor?: string;
    totalFloors?: string;
    buildYear?: number;
    condition?: string;
    buildType?: string;
  };
  description?: string;
  features: string[];
  images: string[];
  agent?: {
    name?: string;
    type?: 'private' | 'agency' | 'developer';
    phone?: string;
    email?: string;
    agency?: string;
    rating?: number;
  };
  listing: {
    type: 'sale' | 'rent';
    category?: 'apartment' | 'house' | 'land' | 'commercial' | 'other';
    postedAt?: string;
    updatedAt?: string;
    featured?: boolean;
    promoted?: boolean;
  };
  source: string;
  url: string;
  scrapedAt: string;
}

export interface SRealityRawListing {
  id?: string | number;
  title?: string;
  description?: string;
  price?: number | string;
  pricePerSqm?: number | string;
  currency?: string;
  area?: number | string;
  rooms?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  floor?: string | number;
  totalFloors?: string | number;
  buildYear?: number | string;
  location?: string;
  address?: string;
  city?: string;
  district?: string;
  region?: string;
  zipCode?: string;
  latitude?: number | string;
  longitude?: number | string;
  images?: string[];
  photos?: string[];
  url?: string;
  link?: string;
  postedAt?: string;
  updatedAt?: string;
  category?: string;
  [key: string]: unknown;
}

export interface ScraperConfig {
  transactionType: 'sale' | 'rent';
  category?: 'apartment' | 'house' | 'land' | 'commercial' | 'all';
  location?: string;
  maxPages?: number;
  delayMs?: number;
  redisUrl?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
  timeout?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
}

// Legacy Property interface (for compatibility with old code)
export interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  propertyType: string;
  transactionType: string;
  source?: string;
  location: {
    address?: string;
    city: string;
    region?: string;
    postcode?: string;
    country: string;
    coordinates?: { lat: number; lon: number };
  };
  details?: {
    sqm?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    floor?: number;
    totalFloors?: number;
    constructionYear?: number;
    availableFrom?: string;
    description?: string;
  };
  features: string[];
  amenities?: any;
  agent?: {
    name?: string;
    agency?: string;
    phone?: string;
    email?: string;
    isPrivate?: boolean;
  };
  metadata?: any;
  images?: string[];
  description?: string;
  url: string;
  scrapedAt?: string;
}

export interface ScraperResult {
  properties: Property[];
  totalFound: number;
  pagesScraped: number;
  errors: string[];
}

export interface SearchOptions {
  city?: string;
  listingType?: 'buy' | 'rent';
  propertyType?: 'apartment' | 'house' | 'land' | 'commercial';
  maxPages?: number;
  headless?: boolean;
  rateLimit?: number;
  timeout?: number;
  retryAttempts?: number;
}
