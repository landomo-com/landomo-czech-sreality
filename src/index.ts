/**
 * SReality.cz Scraper - Entry Point
 */

import { SRealityScraper } from './scraper.js';
import { ScraperConfig } from './types.js';
import { createLogger } from './logger';

const logger = createLogger('SReality:Main');

function parseArgs(): {
  limit?: number;
  redis?: string;
  location?: string;
  transaction?: string;
  category?: string;
} {
  const args = process.argv.slice(2);
  const result: {
    limit?: number;
    redis?: string;
    location?: string;
    transaction?: string;
    category?: string;
  } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--redis' && args[i + 1]) {
      result.redis = args[i + 1];
      i++;
    } else if (args[i] === '--location' && args[i + 1]) {
      result.location = args[i + 1];
      i++;
    } else if (args[i] === '--transaction' && args[i + 1]) {
      result.transaction = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      result.category = args[i + 1];
      i++;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs();

  const listingsPerPage = 20;

  const config: ScraperConfig = {
    transactionType: (args.transaction as 'sale' | 'rent') || 'sale',
    category: (args.category as any) || 'all',
    location: args.location,
    maxPages: args.limit ? Math.ceil(args.limit / listingsPerPage) : undefined,
    delayMs: 1500,
    redisUrl: args.redis,
    retryAttempts: 3,
    retryDelayMs: 1000,
    timeout: 30000,
  };

  logger.info('╔════════════════════════════════════════╗');
  logger.info('║    SReality.cz Czech Scraper (TS)      ║');
  logger.info('╚════════════════════════════════════════╝');
  logger.info(`Transaction type: ${config.transactionType}`);
  logger.info(`Category: ${config.category}`);
  logger.info(`Location: ${config.location || 'All Czech Republic'}`);
  if (config.maxPages) {
    logger.info(`Max pages: ${config.maxPages}`);
  }

  const scraper = new SRealityScraper(config);

  try {
    await scraper.init();
    const properties = await scraper.scrape();

    if (properties.length > 0) {
      logger.info('╔════════════════════════════════════════╗');
      logger.info('║         Sample Properties              ║');
      logger.info('╚════════════════════════════════════════╝');

      const samples = properties.slice(0, 3);
      for (const p of samples) {
        logger.info(`[${p.listing.type.toUpperCase()}] ${p.title}`);
        logger.info(`  Price: ${p.price ? `${p.price.toLocaleString()} ${p.currency}` : 'N/A'}`);
        if (p.pricePerSqm) {
          logger.info(`  Price/m²: ${p.pricePerSqm.toLocaleString()} CZK`);
        }
        logger.info(
          `  Location: ${p.location.city || 'N/A'}${p.location.district ? `, ${p.location.district}` : ''}`
        );
        if (p.details.rooms) {
          logger.info(`  Rooms: ${p.details.rooms}`);
        }
        if (p.details.sqm) {
          logger.info(`  Area: ${p.details.sqm} m²`);
        }
        logger.info(`  Posted: ${p.listing.postedAt || 'N/A'}`);
        logger.info(`  Images: ${p.images.length}`);
        logger.info(`  URL: ${p.url}`);
      }
    }

    logger.info('╔════════════════════════════════════════╗');
    logger.info(`✅ Scraping complete: ${properties.length} properties`);
    logger.info('╚════════════════════════════════════════╝');
  } catch (error) {
    logger.error('Scraper error:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
