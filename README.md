# Sreality.cz (Czech Republic)

> Czech Republic's largest real estate portal

| | |
|---|---|
| Website | https://www.sreality.cz |
| Listings | ~100,000 |
| Scraper | ✅ Working |
| Approach | JSON API (no auth required) |

## Quick Start

```bash
# Search apartments for sale in Prague
curl "https://www.sreality.cz/api/cs/v2/estates?category_main_cb=1&category_type_cb=1&locality_region_id=10&per_page=20"

# Get specific estate details
curl "https://www.sreality.cz/api/cs/v2/estates/{id}"
```

## API Endpoint

```
GET https://www.sreality.cz/api/cs/v2/estates
```

## Query Parameters

| Parameter | Description |
|-----------|-------------|
| `category_main_cb` | 1=apartments, 2=houses, 3=land, 4=commercial |
| `category_type_cb` | 1=sale, 2=rent |
| `locality_region_id` | Region ID (10=Prague, 20=Brno) |
| `per_page` | Results per page |
| `page` | Page number |
| `sort` | 0=newest, 1=cheapest, 2=expensive |
| `czk_price_summary_order2` | Price range |

## Region IDs

| Region | ID |
|--------|---:|
| Prague | 10 |
| Central Bohemia | 11 |
| South Bohemia | 12 |
| Plzeň | 13 |
| Karlovy Vary | 14 |
| Ústí nad Labem | 15 |
| Liberec | 16 |
| Hradec Králové | 17 |
| Pardubice | 18 |
| Vysočina | 19 |
| South Moravia | 20 |
| Olomouc | 21 |
| Zlín | 22 |
| Moravia-Silesia | 23 |

## Data Fields

| Field | Available |
|-------|:---------:|
| ID | ✅ |
| Title | ✅ |
| Price | ✅ |
| Size (m²) | ✅ |
| Rooms | ✅ |
| Floor | ✅ |
| Location | ✅ |
| Coordinates | ✅ |
| Images | ✅ |
| Description | ✅ |
| Features | ✅ |
| Agency | ✅ |

## Response Format

HAL+JSON with `_links` and `_embedded`:
```json
{
  "_embedded": {
    "estates": [...]
  },
  "_links": {
    "self": {"href": "..."},
    "next": {"href": "..."}
  },
  "result_size": 1234
}
```

## Notes

- No authentication required
- Respect rate limits
- API reverse-engineered from Android app

## Files

```
sreality/
├── src/
│   └── scraper.ts
├── decompiled/    # Android app
└── docs/
    ├── API.md
    ├── ENDPOINTS.md
    ├── CODES.md
    └── EXAMPLES.md
```
