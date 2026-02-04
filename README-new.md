# Landomo Czech Sreality Scraper - Phase 2 Architecture

Complete production-grade scraper for **Sreality.cz** (Czech Republic's largest real estate portal) with distributed processing, PostgreSQL change tracking, and Prometheus monitoring.

## Features

✅ **Phase 2 Architecture** - Full implementation with:
- Redis queue-based distributed processing
- PostgreSQL Scraper DB (Tier 1) for historical tracking
- Adaptive scheduling based on change rates
- Prometheus metrics & monitoring
- Missing property verification
- Checksum-based change detection

✅ **Czech Market Support** - Complete Czech-specific fields:
- Disposition format (2+kk, 3+1, etc.)
- Ownership types (Osobní, Družstevní, etc.)
- Building types (Panel, Cihla, etc.)
- Energy ratings
- All Czech amenities

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Redis 7+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/landomo-com/landomo-czech-sreality.git
cd landomo-czech-sreality

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys and database credentials
nano .env
```

### 3. Database Setup

```bash
# Create database
createdb scraper_czech_sreality

# Run schema
psql -U landomo -d scraper_czech_sreality -f database/schema.sql
```

### 4. Run Scraper

**Option A: Manual (Development)**

```bash
# Terminal 1: Start coordinator (discover listings)
npm run coordinator

# Terminal 2: Start worker (process details)
npm run worker

# Terminal 3: Start metrics server
npm run metrics

# Terminal 4: Monitor queue
npm run queue:stats
```

**Option B: Docker (Production)**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f worker

# Scale workers
docker-compose up -d --scale worker=5

# Stop all
docker-compose down
```

## Architecture

### Data Flow

```
1. Coordinator → Discover IDs → Redis Queue
2. Worker(s) → Pop from Queue → Fetch Details → Transform → Core Service
3. Database → Store snapshots + changes
4. Metrics → Expose to Prometheus
5. Verifier → Check missing properties → Mark inactive
```

### Components

| Component | Purpose | Scale |
|-----------|---------|-------|
| **Coordinator** | Discover listing IDs | 1 instance (scheduled) |
| **Worker** | Process property details | 3-10 instances |
| **Worker Verifier** | Verify missing properties | 1 instance |
| **Metrics Server** | Prometheus metrics | 1 instance |
| **Redis** | Queue + caching | 1 instance |
| **PostgreSQL** | Historical data | 1 instance |

## Configuration

### Environment Variables

```bash
# Landomo Core Service
LANDOMO_API_URL=https://core.landomo.com/api/v1
LANDOMO_API_KEY=your_api_key_here

# Redis
REDIS_URL=redis://localhost:6379

# PostgreSQL (Tier 1 Database)
SCRAPER_DB_HOST=localhost
SCRAPER_DB_PORT=5432
SCRAPER_DB_NAME=scraper_czech_sreality
SCRAPER_DB_USER=landomo
SCRAPER_DB_PASSWORD=your_password_here

# Metrics
METRICS_PORT=9090

# Rate Limiting
REQUEST_DELAY_MS=2000
MAX_CONCURRENT_REQUESTS=3
```

## NPM Scripts

```bash
# Core scripts
npm run coordinator        # Discover listing IDs
npm run worker            # Process property details
npm run worker:verifier   # Verify missing properties
npm run metrics           # Start metrics server

# Queue management
npm run queue:stats       # Show queue statistics
npm run queue:clear       # Clear all queue data
npm run queue:retry-failed # Retry failed listings
npm run queue:show-failed  # Show failed listing IDs

# Development
npm run dev               # Watch mode
npm run build             # Build TypeScript
npm run type-check        # Type checking
```

## Czech-Specific Fields

The scraper preserves all Czech market conventions in `country_specific`:

```json
{
  "disposition": "2+kk",
  "disposition_type": "kk",
  "vlastnictvi": "Osobní",
  "stavba": "Panel",
  "stav": "Dobrý",
  "balkony": 1,
  "lodzie": 0,
  "terasy": 0,
  "sklep": true,
  "vytah": true,
  "garaz": false,
  "parkování": "Možné na ulici",
  "energeticka_trida": "C"
}
```

### Disposition Format

Czech real estate uses unique room layouts:

- **2+kk** = 2 rooms + kitchenette (bedroom + living/kitchen combo)
- **2+1** = 2 rooms + separate kitchen (bedroom + living + kitchen)
- **3+kk** = 3 rooms + kitchenette (2 bedrooms + living/kitchen combo)
- **3+1** = 3 rooms + separate kitchen (2 bedrooms + living + kitchen)

The transformer automatically parses these into standard `bedrooms` and `rooms` fields.

## Monitoring

### Prometheus Metrics

Access metrics at `http://localhost:9090/metrics`:

- `scraper_properties_processed_total` - Total processed by status
- `scraper_queue_depth` - Queue depth (main + missing)
- `scraper_change_rate` - Current change rate %
- `scraper_properties_discovered_total` - Total discovered
- `scraper_errors_total` - Total errors by type

### Queue Statistics

```bash
npm run queue:stats
```

Output:
```
=== QUEUE STATISTICS ===
Total Discovered:  145,823
Processed:         98,456 (67.52%)
Remaining:         47,367
Failed:            234
Queue Depth:       47,367
Processing Rate:   45.2 listings/min
ETA:               18h 34m remaining
```

### Database Queries

```sql
-- Recent price changes
SELECT * FROM recent_changes WHERE change_type = 'price' LIMIT 10;

-- High-change properties
SELECT * FROM high_change_properties LIMIT 20;

-- Property change summary
SELECT * FROM property_change_summary ORDER BY change_count DESC LIMIT 10;
```

## Production Deployment

### Kubernetes

```yaml
# Use Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sreality-worker
spec:
  scaleTargetRef:
    name: sreality-worker
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: External
    external:
      metric:
        name: scraper_queue_depth
      target:
        value: 1000
```

### Cron Scheduling

```bash
# Run coordinator every 6 hours
0 */6 * * * cd /app/landomo-czech-sreality && npm run coordinator

# Run verifier daily
0 2 * * * cd /app/landomo-czech-sreality && npm run worker:verifier
```

## Troubleshooting

### Queue Not Processing

```bash
# Check queue stats
npm run queue:stats

# Check failed listings
npm run queue:show-failed

# Retry failed
npm run queue:retry-failed
```

### Rate Limiting / Blocked

Increase delays in `.env`:
```bash
REQUEST_DELAY_MS=5000  # Increase from 2000 to 5000
```

### Database Connection Issues

```bash
# Test connection
psql -U landomo -d scraper_czech_sreality -c "SELECT 1"

# Check schema
psql -U landomo -d scraper_czech_sreality -c "\dt"
```

## Development

### Adding New Fields

1. Update `src/sreality-types.ts` with new field types
2. Update `src/worker.ts` parsing logic
3. Update `src/transformer-new.ts` transformation
4. Update database schema if storing in PostgreSQL

### Testing

```bash
# Test coordinator (discover 100 listings)
LANDOMO_API_KEY=test npm run coordinator rent apartment

# Test worker (process 10 properties)
npm run worker
```

## Performance

| Metric | Value |
|--------|-------|
| Properties per hour | ~2,700 |
| API calls per property | 1 |
| Memory per worker | ~50MB |
| CPU per worker | ~10% |
| Redis memory | ~500MB (100K properties) |
| PostgreSQL storage | ~2GB (100K snapshots) |

## Links

- **Sreality.cz**: https://www.sreality.cz
- **Landomo Registry**: https://github.com/landomo-com/landomo-registry
- **Core Service**: https://github.com/landomo-com/landomo-ingest
- **Phase 2 Architecture**: [docs/PHASE-2-ARCHITECTURE.md](docs/PHASE-2-ARCHITECTURE.md)

## License

UNLICENSED - Landomo Internal Use Only
