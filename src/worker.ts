/**
 * Sreality Worker - Phase 2: Detail Fetching
 *
 * Consumes listing IDs from Redis queue and fetches property details.
 *
 * Usage:
 *   npm run worker
 */

import axios from 'axios';
import { config } from './config';
import { transformToStandard } from './transformer-new';
import { sendToCoreService } from './core';
import { logger } from './logger';
import { randomDelay } from './utils';
import { RedisQueue } from './redis-queue';
import { ScraperDatabase } from './database';
import { ParsedProperty, SrealityDetailResponse } from './sreality-types';

export class SrealityWorker {
  private queue: RedisQueue;
  private db?: ScraperDatabase;
  private workerId: string;
  private isRunning: boolean = false;
  private processedCount: number = 0;
  private failedCount: number = 0;
  private changedCount: number = 0;
  private unchangedCount: number = 0;

  constructor(workerId?: string) {
    this.workerId = workerId || `worker-${process.pid}`;
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
    logger.info(`Worker ${this.workerId} initialized`);
  }

  /**
   * Fetch property details from Sreality API
   */
  async fetchPropertyDetail(hashId: string): Promise<ParsedProperty | null> {
    try {
      const url = `${config.apiBaseUrl}/cs/v2/estates/${hashId}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      const data: SrealityDetailResponse = response.data;

      // Parse the response
      return this.parsePropertyDetail(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // Property not found
      }
      throw error;
    }
  }

  /**
   * Parse Sreality API response into ParsedProperty
   */
  private parsePropertyDetail(data: SrealityDetailResponse): ParsedProperty {
    // Extract basic info
    const id = String(data.hash_id);
    const title = data.name?.value || 'Unknown';
    const price = data.price_czk?.value_raw || data.price || null;

    // Extract property type and transaction
    const categoryMain = data.seo?.category_main_cb || 1;
    const categoryType = data.seo?.category_type_cb || 1;
    const transactionType = categoryType === 1 ? 'sale' : 'rent';

    // Parse items (property details)
    const items = data.items || [];
    const details = this.parseItems(items);

    // Extract images
    const images: string[] = [];
    if (data._embedded?.images) {
      for (const img of data._embedded.images) {
        const href = img._links?.self?.href || img._links?.dynamicDown?.href;
        if (href) {
          images.push(href);
        }
      }
    }

    // Build parsed property
    const parsed: ParsedProperty = {
      id,
      title,
      price,
      currency: 'CZK',
      transaction_type: transactionType,
      property_type: this.getPropertyType(categoryMain),
      location: {
        address: data.locality,
        city: this.extractCity(data.locality),
        country: 'Czech Republic',
        coordinates: data.map ? {
          lat: data.map.lat || 0,
          lon: data.map.lon || 0,
        } : undefined,
      },
      details: {
        rooms: details.rooms,
        bedrooms: details.bedrooms,
        bathrooms: details.bathrooms,
        sqm: details.usableArea || details.floorArea,
        floor: details.floor,
        build_year: details.buildYear,
      },
      description: data.text?.value,
      features: [],
      images,
      country_specific: {
        disposition: details.disposition,
        disposition_type: this.getDispositionType(details.disposition),
        vlastnictvi: details.ownership,
        stavba: details.buildingType,
        stav: details.condition,
        balkony: details.balconies,
        lodzie: details.loggias,
        terasy: details.terraces,
        sklep: details.hasCellar,
        vytah: details.hasElevator,
        garaz: details.hasGarage,
        parkování: details.parking,
        energeticka_trida: details.energyClass,
      },
      url: `${config.baseUrl}${data._links?.self?.href || '/detail/' + id}`,
      scraped_at: new Date().toISOString(),
    };

    return parsed;
  }

  /**
   * Parse Sreality items array into structured details
   */
  private parseItems(items: Array<{ name: string; value: string; type?: string }>): any {
    const details: any = {};

    for (const item of items) {
      const name = item.name.toLowerCase();
      const value = item.value;

      // Parse various fields
      if (name.includes('dispozice')) {
        details.disposition = value;
      } else if (name.includes('užitná plocha') || name.includes('plocha podlahová')) {
        details.usableArea = this.parseNumber(value);
      } else if (name.includes('plocha pozemku')) {
        details.landArea = this.parseNumber(value);
      } else if (name.includes('vlastnictví')) {
        details.ownership = value;
      } else if (name.includes('stavba')) {
        details.buildingType = value;
      } else if (name.includes('stav objektu')) {
        details.condition = value;
      } else if (name.includes('podlaží')) {
        details.floor = value;
      } else if (name.includes('balkón')) {
        details.balconies = this.parseNumber(value) || (value.toLowerCase().includes('ano') ? 1 : 0);
      } else if (name.includes('lodžie')) {
        details.loggias = this.parseNumber(value) || (value.toLowerCase().includes('ano') ? 1 : 0);
      } else if (name.includes('terasa')) {
        details.terraces = this.parseNumber(value) || (value.toLowerCase().includes('ano') ? 1 : 0);
      } else if (name.includes('sklep')) {
        details.hasCellar = value.toLowerCase().includes('ano');
      } else if (name.includes('výtah')) {
        details.hasElevator = value.toLowerCase().includes('ano');
      } else if (name.includes('garáž')) {
        details.hasGarage = value.toLowerCase().includes('ano');
      } else if (name.includes('parkování')) {
        details.parking = value;
      } else if (name.includes('energetická')) {
        details.energyClass = value;
      }
    }

    return details;
  }

  /**
   * Parse number from Czech-formatted string
   */
  private parseNumber(value: string): number | undefined {
    if (!value) return undefined;
    const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Extract city from locality string
   */
  private extractCity(locality: string): string | undefined {
    if (!locality) return undefined;
    // Simple extraction - take first part before comma
    const parts = locality.split(',');
    return parts[0].trim();
  }

  /**
   * Get property type from category code
   */
  private getPropertyType(categoryMain: number): string {
    const map: Record<number, string> = {
      1: 'apartment',
      2: 'house',
      3: 'land',
      4: 'commercial',
    };
    return map[categoryMain] || 'other';
  }

  /**
   * Get disposition type from disposition string
   */
  private getDispositionType(disposition?: string): 'kk' | '1' | undefined {
    if (!disposition) return undefined;
    if (disposition.includes('kk')) return 'kk';
    if (disposition.match(/\+\d/)) return '1';
    return undefined;
  }

  /**
   * Process single listing ID
   */
  async processListing(id: string): Promise<boolean> {
    try {
      // Check if already processed
      const isProcessed = await this.queue.isProcessed(id);
      if (isProcessed) {
        logger.debug(`[${this.workerId}] Skipping ${id} - already processed`);
        return true;
      }

      // Fetch property details
      const property = await this.fetchPropertyDetail(id);

      if (!property) {
        // Property not found - mark for verification
        await this.queue.pushToMissingQueue([id]);
        logger.info(`[${this.workerId}] Property ${id} not found - queued for verification`);
        this.failedCount++;
        return false;
      }

      // Check for changes
      const hasChanged = await this.queue.hasPropertyChanged(id, property);

      if (hasChanged) {
        // Transform and send to Core Service
        const standard = transformToStandard(property);

        await sendToCoreService({
          portal: config.portal,
          portal_id: id,
          country: config.country,
          data: standard,
          raw_data: property,
        });

        // Store snapshot
        await this.queue.storePropertySnapshot(id, property);

        // Store in database (if enabled)
        if (this.db) {
          const checksum = JSON.stringify(property);
          await this.db.storeSnapshot(id, property, checksum);
        }

        this.changedCount++;
        logger.info(`[${this.workerId}] ✓ Processed ${id} (CHANGED)`);
      } else {
        this.unchangedCount++;
        logger.debug(`[${this.workerId}] ✓ Processed ${id} (unchanged)`);
      }

      // Mark as processed
      await this.queue.markProcessed(id);
      this.processedCount++;

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[${this.workerId}] Failed to process ${id}:`, errorMsg);
      this.failedCount++;
      return false;
    }
  }

  /**
   * Start worker (blocking loop)
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info(`[${this.workerId}] Starting worker...`);

    let emptyQueueCount = 0;
    const maxEmptyChecks = 10;

    while (this.isRunning) {
      try {
        // Pop next ID from queue
        const id = await this.queue.popListingId(5);

        if (!id) {
          emptyQueueCount++;

          if (emptyQueueCount >= maxEmptyChecks) {
            logger.info(`[${this.workerId}] Queue empty after ${maxEmptyChecks} checks. Stopping.`);
            break;
          }

          logger.info(`[${this.workerId}] Queue empty (${emptyQueueCount}/${maxEmptyChecks})`);
          continue;
        }

        // Reset empty count
        emptyQueueCount = 0;

        // Process the listing
        await this.processListing(id);

        // Rate limiting
        await randomDelay(config.requestDelayMs, config.requestDelayMs + 2000);

        // Log progress every 10 properties
        if (this.processedCount % 10 === 0 && this.processedCount > 0) {
          logger.info(
            `[${this.workerId}] Progress: ${this.processedCount} processed ` +
            `(${this.changedCount} changed, ${this.unchangedCount} unchanged, ${this.failedCount} failed)`
          );
        }
      } catch (error) {
        logger.error(`[${this.workerId}] Worker error:`, error);
        await randomDelay(5000, 10000);
      }
    }

    logger.info(
      `[${this.workerId}] Worker stopped. ` +
      `Processed: ${this.processedCount}, Changed: ${this.changedCount}, ` +
      `Unchanged: ${this.unchangedCount}, Failed: ${this.failedCount}`
    );
  }

  /**
   * Stop worker gracefully
   */
  async stop(): Promise<void> {
    logger.info(`[${this.workerId}] Stopping worker...`);
    this.isRunning = false;
    await this.queue.close();
    if (this.db) {
      await this.db.close();
    }
  }
}

// Main execution
async function main() {
  const workerId = process.env.WORKER_ID || `worker-${process.pid}`;

  logger.info('Starting Sreality Worker');
  logger.info(`Worker ID: ${workerId}`);

  const worker = new SrealityWorker(workerId);
  await worker.initialize();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  try {
    await worker.start();
  } catch (error) {
    logger.error('Worker failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
