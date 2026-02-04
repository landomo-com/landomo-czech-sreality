import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Landomo Core Service
  apiUrl: process.env.LANDOMO_API_URL || 'https://core.landomo.com/api/v1',
  apiKey: process.env.LANDOMO_API_KEY || '',

  // Scraper Identity
  portal: 'sreality',
  country: 'czech',

  // Sreality API/Website
  baseUrl: 'https://www.sreality.cz',
  apiBaseUrl: 'https://www.sreality.cz/api',

  // Scraper Behavior
  debug: process.env.DEBUG === 'true',
  requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || '2000'),
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '3'),
  pageSize: parseInt(process.env.PAGE_SIZE || '60'), // Sreality default page size

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },

  // Scraper Database (Tier 1)
  scraperDb: {
    host: process.env.SCRAPER_DB_HOST,
    port: parseInt(process.env.SCRAPER_DB_PORT || '5432'),
    database: process.env.SCRAPER_DB_NAME || 'scraper_czech_sreality',
    user: process.env.SCRAPER_DB_USER || 'landomo',
    password: process.env.SCRAPER_DB_PASSWORD,
  },

  // Optional: Proxy
  proxy: {
    url: process.env.PROXY_URL,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
  },
};

// Major Czech cities for scraping
export const CZECH_CITIES = [
  'praha',           // Prague
  'brno',            // Brno
  'ostrava',         // Ostrava
  'plzen',           // Pilsen
  'liberec',         // Liberec
  'olomouc',         // Olomouc
  'ceske-budejovice',// České Budějovice
  'hradec-kralove',  // Hradec Králové
  'usti-nad-labem',  // Ústí nad Labem
  'pardubice',       // Pardubice
  'zlin',            // Zlín
  'havirov',         // Havířov
  'kladno',          // Kladno
  'most',            // Most
  'opava',           // Opava
  'frydek-mistek',   // Frýdek-Místek
  'karlovy-vary',    // Karlovy Vary
  'jihlava',         // Jihlava
  'teplice',         // Teplice
  'karvina',         // Karviná
];

// Czech regions
export const CZECH_REGIONS = [
  'praha',                    // Prague
  'stredocesky-kraj',        // Central Bohemian Region
  'jihocesky-kraj',          // South Bohemian Region
  'plzensky-kraj',           // Plzeň Region
  'karlovarsky-kraj',        // Karlovy Vary Region
  'ustecky-kraj',            // Ústí nad Labem Region
  'liberecky-kraj',          // Liberec Region
  'kralovehradecky-kraj',    // Hradec Králové Region
  'pardubicky-kraj',         // Pardubice Region
  'vysocina',                // Vysočina Region
  'jihomoravsky-kraj',       // South Moravian Region
  'olomoucky-kraj',          // Olomouc Region
  'zlinsky-kraj',            // Zlín Region
  'moravskoslezsky-kraj',    // Moravian-Silesian Region
];

// Sreality category/estate type mapping
export const SREALITY_CATEGORIES = {
  // For sale
  sale: {
    apartment: 1,
    house: 2,
    land: 3,
    commercial: 4,
    other: 5,
  },
  // For rent
  rent: {
    apartment: 1,
    house: 2,
    commercial: 3,
    other: 4,
  },
};

// Validate required config
if (!config.apiKey) {
  console.warn('WARNING: LANDOMO_API_KEY not set - will not send to Core Service');
}
