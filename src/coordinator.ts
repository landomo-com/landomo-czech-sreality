/**
 * Sreality Coordinator - Phase 1: ID Discovery
 *
 * Discovers all listing IDs and pushes them to Redis queue for workers to process.
 *
 * Usage:
 *   npm run coordinator
 */

import axios from 'axios';
import { config, CZECH_CITIES } from './config';
import { logger } from './logger';
import { randomDelay } from './utils';
import { RedisQueue } from './redis-queue';
import { ScraperDatabase } from './database';

export class SrealityCoordinator {
  public queue: RedisQueue;
  private db?: ScraperDatabase;

  constructor() {
    this.queue = new RedisQueue('sreality');
    if (config.scraperDb.host) {
      this.db = new ScraperDatabase();
    }
  }

  async initialize() {
    await this.queue.initialize();
    if (this.db) {
      await this.db.initialize();
    }
    logger.info('Coordinator initialized');
  }

  /**
   * Fetch listing IDs from Sreality API
   */
  async fetchListingIds(
    category: number,
    transactionType: number,
    locality?: string,
    page: number = 1,
    perPage: number = 60
  ): Promise<{ ids: string[]; total: number }> {
    try {
      // Build URL - Sreality API format
      let url = `${config.apiBaseUrl}/cs/v2/estates?`;

      // Category and transaction type
      url += `category_main_cb=${category}&category_type_cb=${transactionType}`;

      // Location (if specified)
      if (locality) {
        url += `&locality_region_id=${locality}`;
      }

      // Pagination
      url += `&per_page=${perPage}&page=${page}`;

      logger.debug(`Fetching: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      const data = response.data;
      const estates = data._embedded?.estates || [];
      const ids = estates.map((e: any) => String(e.hash_id));

      return {
        ids,
        total: data.result_size || 0,
      };
    } catch (error) {
      logger.error('Failed to fetch listing IDs:', error);
      throw error;
    }
  }

  /**
   * Discover all listings for a specific category and transaction type
   */
  async discoverAll(
    transactionType: 'sale' | 'rent',
    category: 'apartment' | 'house' | 'land' | 'commercial' | 'all' = 'all'
  ): Promise<number> {
    logger.info(`Starting discovery for ${transactionType} - ${category}`);

    const transactionCode = transactionType === 'sale' ? 1 : 2;
    const categories = category === 'all'
      ? [1, 2, 3, 4]  // apartment, house, land, commercial
      : [this.getCategoryCode(category, transactionType)];

    let totalDiscovered = 0;

    for (const cat of categories) {
      logger.info(`Discovering category ${cat}...`);

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        try {
          const { ids, total } = await this.fetchListingIds(cat, transactionCode, undefined, page, 60);

          if (ids.length === 0) {
            hasMore = false;
            break;
          }

          // Push to queue
          const newCount = await this.queue.pushListingIds(ids);
          totalDiscovered += newCount;

          logger.info(
            `Page ${page}: Found ${ids.length} IDs, ${newCount} new (Total discovered: ${totalDiscovered})`
          );

          // Check if there are more pages
          const expectedPages = Math.ceil(total / 60);
          if (page >= expectedPages) {
            hasMore = false;
          } else {
            page++;
            await randomDelay(2000, 4000); // Rate limiting
          }
        } catch (error) {
          logger.error(`Error on page ${page}:`, error);
          // Continue to next page on error
          page++;
          if (page > 100) break; // Safety limit
          await randomDelay(5000, 10000);
        }
      }
    }

    logger.info(`Discovery complete: ${totalDiscovered} new listings discovered`);
    return totalDiscovered;
  }

  /**
   * Get category code for Sreality API
   */
  private getCategoryCode(category: string, transactionType: 'sale' | 'rent'): number {
    const map: Record<string, Record<string, number>> = {
      sale: { apartment: 1, house: 2, land: 3, commercial: 4 },
      rent: { apartment: 1, house: 2, commercial: 3 },
    };
    return map[transactionType][category] || 1;
  }

  /**
   * Close connections
   */
  async close() {
    await this.queue.close();
    if (this.db) {
      await this.db.close();
    }
  }
}

// Main execution
async function main() {
  const transactionType = (process.argv[2] || 'rent') as 'sale' | 'rent';
  const category = (process.argv[3] || 'all') as 'apartment' | 'house' | 'land' | 'commercial' | 'all';

  logger.info('Starting Sreality Coordinator');
  logger.info(`Transaction Type: ${transactionType}`);
  logger.info(`Category: ${category}`);

  const coordinator = new SrealityCoordinator();
  await coordinator.initialize();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await coordinator.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await coordinator.close();
    process.exit(0);
  });

  try {
    const discovered = await coordinator.discoverAll(transactionType, category);
    logger.info(`=== DISCOVERY COMPLETE: ${discovered} new listings ===`);

    // Show queue stats
    const stats = await coordinator.queue.getStats();
    logger.info('=== QUEUE STATS ===');
    logger.info(`Total Discovered: ${stats.totalDiscovered}`);
    logger.info(`Queue Depth: ${stats.queueDepth}`);
    logger.info(`Processed: ${stats.processedCount}`);
    logger.info(`Failed: ${stats.failedCount}`);
  } catch (error) {
    logger.error('Coordinator failed:', error);
    process.exit(1);
  } finally {
    await coordinator.close();
  }
}

if (require.main === module) {
  main();
}
