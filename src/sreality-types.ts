/**
 * Sreality.cz-specific types
 */

export interface SrealityListing {
  hash_id: number;
  locality: string;
  name: string;
  locality_district_id?: number;
  price?: number;
  price_czk?: number;
  _embedded?: {
    seller?: {
      name?: string;
      phones?: string[];
      email?: string;
    };
  };
  _links?: {
    self?: {
      href?: string;
    };
    images?: Array<{
      href?: string;
    }>;
  };
}

export interface SrealityDetailResponse {
  hash_id: number;
  name: {
    value: string;
  };
  locality: string;
  price?: number;
  price_czk?: {
    value_raw: number;
    unit: string;
    currency: string;
  };
  items?: Array<{
    name: string;
    value: string;
    type?: string;
    unit?: string;
  }>;
  text?: {
    value: string;
  };
  _embedded?: {
    images?: Array<{
      _links?: {
        self?: {
          href: string;
        };
        dynamicDown?: {
          href: string;
        };
      };
    }>;
    seller?: {
      user_name?: string;
      phones?: Array<{
        number: string;
      }>;
      email?: string;
      company?: {
        name?: string;
      };
    };
  };
  _links?: {
    self?: {
      href: string;
    };
  };
  seo?: {
    locality?: string;
    category_main_cb?: number;
    category_type_cb?: number;
    category_sub_cb?: number;
  };
  map?: {
    lat?: number;
    lon?: number;
  };
}

export interface SrealitySearchResponse {
  _embedded: {
    estates: SrealityListing[];
  };
  result_size: number;
  per_page: number;
  page: number;
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

export interface ParsedProperty {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  transaction_type: 'sale' | 'rent';
  property_type: string;
  location: {
    address?: string;
    city?: string;
    district?: string;
    region?: string;
    postal_code?: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  details: {
    bedrooms?: number;
    bathrooms?: number;
    rooms?: number;
    sqm?: number;
    floor?: string;
    total_floors?: string;
    build_year?: number;
    condition?: string;
    build_type?: string;
  };
  description?: string;
  features: string[];
  images: string[];
  country_specific: {
    disposition?: string;          // Czech room layout (e.g., "2+kk", "3+1")
    disposition_type?: string;     // "kk" (kitchenette) or "1" (separate kitchen)
    vlastnictvi?: string;          // Ownership type (Osobní, Družstevní, etc.)
    stavba?: string;               // Building type (Panel, Cihla, etc.)
    stav?: string;                 // Property condition (Dobrý, Po rekonstrukci, etc.)
    balkony?: number;              // Number of balconies
    lodzie?: number;               // Number of loggias
    terasy?: number;               // Number of terraces
    sklep?: boolean;               // Has cellar
    vytah?: boolean;               // Has elevator
    garaz?: boolean;               // Has garage
    parkování?: string;            // Parking type
    elektrina?: string;            // Electricity
    plyn?: boolean;                // Gas
    voda?: string;                 // Water supply
    odpad?: string;                // Waste disposal
    telekomunikace?: string;       // Telecommunications
    doprava?: string;              // Transportation
    bazeny?: boolean;              // Has pool
    vyhled?: string;               // View
    energeticka_trida?: string;    // Energy class (A-G)
  };
  url: string;
  scraped_at: string;
}
