# Sreality.cz Scraper - Czech Republic

Production-ready scraper for Sreality.cz, Czech Republic's largest real estate portal with 100,000+ property listings.

**Status**: ⚠️ **NEEDS API REFACTORING** | **Coverage**: 100% (potential) | **Architecture**: Phase 2 Ready

---

## Important Note: API Refactoring Required

⚠️ **Current Status**: This scraper has Phase 2 architecture infrastructure in place (coordinator, worker, Redis queue, metrics) but the core scraping logic needs to be refactored to use the **Sreality JSON API** instead of HTML parsing.

**What's Ready**:
- ✅ Phase 2 architecture (coordinator, worker, Redis queue)
- ✅ Comprehensive API documentation (reverse-engineered from Android app)
- ✅ Transformer with Czech-specific field mappings
- ✅ Docker deployment configuration
- ✅ PostgreSQL database schema
- ✅ Metrics and monitoring setup

**What Needs Work**:
- ⚠️ Replace HTML parsing with JSON API calls
- ⚠️ Implement Phase 1 (discovery) using `/estates` endpoint
- ⚠️ Implement Phase 2 (details) using `/estates/{id}` endpoint
- ⚠️ Add comprehensive integration tests
- ⚠️ Verify 100% field coverage

**Estimated Effort**: 4-6 hours of refactoring

See [INVESTIGATION-REPORT.md](INVESTIGATION-REPORT.md) for complete API analysis and migration strategy.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run coordinator (Phase 2 discovery)
npm run coordinator

# Run worker (Phase 2 detail fetching)
npm run worker

# View queue stats
npm run queue:stats
```

---

## API Information

### Base Endpoint

```
https://www.sreality.cz/api/cs/v2/estates
```

### Key Features

- ✅ **No Authentication Required** - Public JSON API
- ✅ **HAL+JSON Format** - Standardized hypermedia API
- ✅ **100,000+ Listings** - Comprehensive coverage of Czech Republic
- ✅ **15+ Fields per Property** - Rich property data
- ✅ **GPS Coordinates** - Precise location data
- ✅ **Full CDN Image URLs** - All property images

### API Endpoints

1. **Search Listings**: `GET /estates`
   - Parameters: `category_main_cb`, `category_type_cb`, `locality_region_id`, `per_page`, `page`, `sort`
   - Returns: Array of listings with basic info + listing IDs

2. **Property Details**: `GET /estates/{hash_id}`
   - Returns: Complete property data with all fields

3. **Count Listings**: `GET /estates/count`
   - Returns: Total count of matching properties

See [docs/API.md](docs/API.md) for complete API documentation.

---

## Data Extraction

### Coverage Summary

**Transaction Types**: ✅ Sale, ✅ Rent
**Property Types**: ✅ Apartments, ✅ Houses, ✅ Land, ✅ Commercial
**Regions**: ✅ All 14 Czech regions (Prague, Brno, Ostrava, etc.)
**Field Coverage**: ⚠️ 100% available (needs verification after API refactoring)

### Fields Extracted

✅ **Core Property Data**
- ID (hash_id), title, price (CZK), property type, transaction type, URL

✅ **Location**
- Full address, city, region, GPS coordinates (lat/lon)

✅ **Property Details**
- Usable area (m²), total area, disposition (Czech format: 2+kk, 3+1)
- Floor number, total floors, rooms, balcony area, cellar area

✅ **Features & Amenities**
- Building type (panel, brick, mixed), ownership type (personal, cooperative)
- Energy rating, furnished status, elevator, barrier-free access
- Features array (parsed from labels)

✅ **Images**
- All property images with full CDN URLs
- Dynamic resizing support

✅ **Czech-Specific Fields**
- Disposition format (1+kk, 2+1, 3+kk, etc.)
- Building type (Panel, Cihla, Smíšená)
- Ownership (Osobní, Družstevní, Státní)
- Energy rating (Třída A-G)

See [docs/EXAMPLES.md](docs/EXAMPLES.md) for sample API responses and field mappings.

---

## Czech-Specific Conventions

### Disposition Format

Czech Republic uses unique room notation:

| Disposition | Meaning | StandardProperty |
|-------------|---------|------------------|
| 1+kk | 1 room + kitchenette | 1 bedroom, studio |
| 1+1 | 1 room + separate kitchen | 1 bedroom |
| 2+kk | 2 rooms + kitchenette | 1 bedroom |
| 2+1 | 2 rooms + separate kitchen | 2 bedrooms |
| 3+kk | 3 rooms + kitchenette | 2 bedrooms |
| 3+1 | 3 rooms + separate kitchen | 3 bedrooms |

The transformer maps Czech dispositions to standardized bedroom counts.

### Property Types

| Czech | English | StandardProperty |
|-------|---------|------------------|
| Byt | Apartment | apartment |
| Dům | House | house |
| Pozemek | Land | land |
| Komerční | Commercial | commercial |

### Building Types

| Czech | English |
|-------|---------|
| Panel | Panel building (prefab) |
| Cihla/Cihlová | Brick construction |
| Smíšená | Mixed construction |

---

## Architecture

### Phase 2 Architecture

This scraper implements **Phase 2 architecture** with coordinator and workers:

```
Coordinator (discovery)
    ↓
Redis Queue (listing IDs)
    ↓
Workers (parallel detail fetching)
    ↓
Transformer (Sreality → StandardProperty)
    ↓
Core Service API (POST /properties/ingest)
```

### Components

- **`src/coordinator.ts`** - Phase 1: Discover listing IDs from search API
- **`src/worker.ts`** - Phase 2: Fetch full property details in parallel
- **`src/transformer.ts`** - Transform Sreality data to StandardProperty format
- **`src/redis-queue.ts`** - Redis-based job queue with retry logic
- **`src/database.ts`** - PostgreSQL for raw data storage
- **`src/metrics.ts`** - Prometheus metrics for monitoring
- **`src/core.ts`** - Core Service API integration

See [docs/PHASE-2-ARCHITECTURE.md](docs/PHASE-2-ARCHITECTURE.md) for architecture details.

---

## Configuration

### Environment Variables

```bash
# Core Service API
LANDOMO_API_URL=https://core.landomo.com/api/v1
LANDOMO_API_KEY=your_api_key_here

# Scraper Settings
DEBUG=false
REQUEST_DELAY_MS=2000
MAX_CONCURRENT_REQUESTS=3

# Redis (required for Phase 2)
REDIS_URL=redis://localhost:6379

# Scraper Database (Tier 1)
SCRAPER_DB_HOST=localhost
SCRAPER_DB_PORT=5432
SCRAPER_DB_NAME=scraper_czech_sreality
SCRAPER_DB_USER=landomo
SCRAPER_DB_PASSWORD=your_password_here

# Prometheus Metrics
METRICS_PORT=9090
METRICS_UPDATE_INTERVAL=15000
```

Copy `.env.example` to `.env` and configure.

---

## Commands

### Phase 2 Operations

```bash
# Start coordinator (discovery phase)
npm run coordinator

# Start worker (detail fetching phase)
npm run worker

# Start worker with verification
npm run worker:verifier

# View metrics server
npm run metrics
```

### Queue Management

```bash
# View queue statistics
npm run queue:stats

# Clear all queues
npm run queue:clear

# Retry failed jobs
npm run queue:retry-failed

# Show failed jobs
npm run queue:show-failed
```

### Development

```bash
npm run dev              # Watch mode
npm run build            # Compile TypeScript
npm run lint             # Run linter
npm run type-check       # TypeScript type checking
```

---

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- `coordinator` - Listing discovery
- `worker` - Detail fetching (3 instances)
- `redis` - Job queue
- `postgres` - Scraper database
- `metrics` - Prometheus metrics

---

## Documentation

Complete documentation in [`docs/`](docs/) folder:

- **[API.md](docs/API.md)** - Complete API reference (reverse-engineered)
- **[ENDPOINTS.md](docs/ENDPOINTS.md)** - Endpoint documentation
- **[CODES.md](docs/CODES.md)** - Category and region codes
- **[EXAMPLES.md](docs/EXAMPLES.md)** - API response examples
- **[PHASE-2-ARCHITECTURE.md](docs/PHASE-2-ARCHITECTURE.md)** - Architecture overview
- **[INVESTIGATION-REPORT.md](INVESTIGATION-REPORT.md)** - Complete API investigation and migration strategy

---

## Refactoring Roadmap

### Priority 1: Replace Scraper Logic (4-6 hours)

1. **Update `coordinator.ts`** to use JSON API
   - Iterate through all regions (10-23)
   - Test both sale (1) and rent (2) transactions
   - Test all categories (apartments, houses, land, commercial)
   - Paginate through results (`per_page=60`, continue until empty)
   - Extract `hash_id` for each listing
   - Add to Redis queue

2. **Update `worker.ts`** to fetch details
   - Consume `hash_id` from Redis queue
   - Fetch complete property data: `GET /estates/{hash_id}`
   - Transform to StandardProperty format
   - Send to Core Service
   - Handle errors and retries

3. **Verify `transformer.ts`** mappings
   - Ensure all API fields are mapped
   - Test Czech-specific field handling
   - Verify disposition format parsing
   - Test image URL extraction

4. **Add Integration Tests**
   - Test API connectivity
   - Test field extraction
   - Verify 100% field coverage
   - Test change detection

### Priority 2: Optimization (2-3 hours)

1. **Add change detection**
   - Use `sort=0` (newest first)
   - Monitor `new: true` flag
   - Store price hashes for change detection

2. **Add inactive detection**
   - Track all known listing IDs
   - Periodically check for 404s
   - Mark as inactive when absent from search

3. **Performance tuning**
   - Optimize API request rate (1-2s delays)
   - Tune worker concurrency
   - Add caching where appropriate

---

## Monitoring

### Metrics Exposed

```
sreality_properties_discovered_total    # Listings found by coordinator
sreality_properties_processed_total     # Details fetched by workers
sreality_api_requests_total             # API calls made
sreality_api_errors_total               # API errors
sreality_processing_duration_seconds    # Processing time histogram
sreality_queue_size                     # Current queue size
```

Access metrics at `http://localhost:9090/metrics`

---

## Technical Stack

- **Language**: TypeScript
- **HTTP Client**: axios
- **Queue**: Redis + ioredis
- **Database**: PostgreSQL + pg
- **Logging**: Winston
- **Metrics**: Prometheus (prom-client)
- **Deployment**: Docker + docker-compose

---

## Region Coverage

All 14 Czech regions supported:

| Region | ID | Major Cities |
|--------|---:|--------------|
| Prague | 10 | Praha |
| Central Bohemia | 11 | Kladno, Mladá Boleslav |
| South Bohemia | 12 | České Budějovice, Tábor |
| Plzeň | 13 | Plzeň |
| Karlovy Vary | 14 | Karlovy Vary, Cheb |
| Ústí nad Labem | 15 | Ústí nad Labem, Děčín |
| Liberec | 16 | Liberec, Jablonec nad Nisou |
| Hradec Králové | 17 | Hradec Králové, Pardubice |
| Pardubice | 18 | Pardubice, Chrudim |
| Vysočina | 19 | Jihlava, Havlíčkův Brod |
| South Moravia | 20 | Brno, Znojmo |
| Olomouc | 21 | Olomouc, Prostějov |
| Zlín | 22 | Zlín, Vsetín |
| Moravia-Silesia | 23 | Ostrava, Opava |

See [docs/CODES.md](docs/CODES.md) for complete region codes.

---

## Performance Expectations

**After API Refactoring**:
- Processing Speed: 10-20 listings/second (with detail fetching)
- Total Scraping Time: ~2-4 hours for full Czech Republic
- Memory Usage: < 200MB
- Error Rate: < 0.5% (API is very stable)

---

## Troubleshooting

### Queue not processing

- Check Redis connection: `redis-cli ping`
- Verify worker is running: `docker-compose ps`
- Check logs: `docker-compose logs worker`

### API errors

- Verify API endpoint is accessible: `curl https://www.sreality.cz/api/cs/v2/estates`
- Check rate limiting (add delays if needed)
- Review error logs for specific issues

### Missing data

- Verify transformer is handling all fields
- Check field mapping in `transformer.ts`
- Run integration tests to verify coverage

---

## Next Steps

1. ✅ Repository migrated from old folder
2. ✅ Phase 2 architecture infrastructure in place
3. ✅ API documentation complete
4. ⚠️ **TODO**: Refactor coordinator to use JSON API (4-6 hours)
5. ⚠️ **TODO**: Update worker for API detail fetching
6. ⚠️ **TODO**: Add integration tests
7. ⚠️ **TODO**: Deploy and run full test scrape

---

## License

UNLICENSED - Proprietary

---

## Support

- Documentation: [`docs/`](docs/)
- Investigation Report: [INVESTIGATION-REPORT.md](INVESTIGATION-REPORT.md)
- Global Architecture: `/home/samuelseidel/landomo/CLAUDE.md`
- Issues: Create issue in landomo-registry repository

---

**Maintained by**: Landomo
**Last Updated**: 2026-02-05
**Status**: ⚠️ Needs API Refactoring (4-6 hours estimated)
