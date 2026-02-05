# Sreality.cz API Analysis

Analysis from decompiled Android APK v1.5.2.

## Base Configuration

```
Base URL: https://www.sreality.cz/api
API Version: /cs/v2/
Full Base: https://www.sreality.cz/api/cs/v2/
```

## HTTP Headers

The app sends these headers with all requests:

```
User-Agent: Android({version});{packageName};{appVersion}({versionCode});
X-Instance-Id: {instanceId}
```

For authenticated requests (using Seznam.cz account):
- **DsCookie**: Cookie-based auth with `ds` cookie
- **LsdsCookie**: Cookie-based auth with `lsds` cookie
- **Bearer**: Bearer token authorization header

## API Endpoints

### 1. Filters/Configuration

**GET /cs/v2/filters**
- Returns available filter options for property search
- No authentication required
- Response structure:
  - `filters`: Filter definitions
  - `linked_filters`: Linked filter mappings
  - `blended`: Blended search config

**GET /cs/v2/project-filters**
- Returns filter options for new development projects

### 2. Property Search

**GET /cs/v2/estates**
- Main property search endpoint
- Query parameters built from filter selections

**Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `category_main_cb` | Main category (1=apartments, 2=houses, etc.) | `1` |
| `category_type_cb` | Transaction type (1=sale, 2=rent, etc.) | `1` |
| `locality_region_id` | Region ID | `10` |
| `locality_district_id` | District ID | `5001` |
| `locality_country_id` | Country (112=CZ, 10001=abroad, 10000=all) | `112` |
| `price_from` | Min price | `1000000` |
| `price_to` | Max price | `5000000` |
| `usable_area` | Floor area range | `50\|100` |
| `estate_age` | Property age filter | |
| `sort` | Sort order (0=newest, 1=cheapest, 2=expensive, 4=nearest) | `0` |
| `gps` | GPS coordinates for distance sort | `lat\|lon` |
| `distance` | Distance from GPS point | |
| `per_page` | Results per page | `20` |
| `page` | Page number | `1` |

Multiple values separated by `|` (pipe character).

**GET /cs/v2/estates/count**
- Returns count of matching properties
- Same parameters as /estates

**GET /cs/v2/estates/{hash_id}**
- Property detail by hash ID

**GET /cs/v2/estate-iterator/{position}**
- Navigate through search results
- Same query params as search

### 3. Projects (New Developments)

**GET /cs/v2/projects**
- Search new development projects
- Similar params to estates

**GET /cs/v2/projects/count**
- Count of matching projects

**GET /cs/v2/project-iterator/{position}**
- Navigate through project results

### 4. Map/Clusters

**GET /cs/v2/clusters**
- Returns clustered map markers
- Additional params for map bounds:
  - `sw`: Southwest corner coordinates
  - `ne`: Northeast corner coordinates
  - `zoom`: Map zoom level

Response structure:
```json
{
  "clusters": [...],
  "leftBottomBounding": {"lat": ..., "lon": ...},
  "rightTopBounding": {"lat": ..., "lon": ...}
}
```

### 5. Location Suggest/Autocomplete

**GET /cs/v2/suggest**

**Parameters:**
| Parameter | Description |
|-----------|-------------|
| `phrase` | Search text |
| `category` | Location types to search |
| `locality_country_id` | Country filter |
| `count` | Max results (default: 20) |

**Category values:**
- Czech: `region_cz,district_cz,municipality_cz,ward_cz,quarter_cz,street_cz`
- Slovak: `region_sk,district_sk,municipality_sk,ward_sk,quarter_sk,street_sk`
- Foreign: `muni_osm` (OpenStreetMap)

### 6. Homepage

**GET /cs/v2/hp**
- Homepage content with stacks (saved searches, favorites, etc.)
- Optional Cookie header: `lastsrch="{escaped_json}";`

### 7. Contact/Email

**POST /cs/v2/email-query**
- Send inquiry about property
- Content-Type: application/json

```json
{
  "agree_to_terms": true,
  "name": "...",
  "email": "...",
  "phone": "...",
  "text": "...",
  "hash_id": 123456
}
```

**POST /cs/v2/email-seller**
- Contact seller directly

```json
{
  "agree_to_terms": true,
  "name": "...",
  "email": "...",
  "phone": "...",
  "text": "...",
  "orderId": 123,
  "user_id": 456
}
```

### 8. Push Notifications / Mobile Device

**POST /cs/v2/mobile_device/gcm/{fcm_token}**
- Register device for push notifications
- Returns `device_hash`

**PUT /cs/v2/mobile_device/{device_hash}/{fcm_token}**
- Update device registration

**GET /cs/v2/mobile_device/{device_hash}**
- Unregister device

### 9. User Features (Authenticated)

These require Seznam.cz account authentication:

**Favorites:**
- Links from estate detail `_embedded.favourite._links.self.href`
- `is_favourite` boolean in response

**Notes:**
- `_embedded.note._links.self.href`
- `has_note`, `note` fields

**Saved Searches (Stacks):**
- `_embedded.is_saved` in list responses
- `stack_remover` link to delete saved search

## Response Structure (HAL+JSON)

Responses use HAL (Hypertext Application Language) format:

```json
{
  "_links": {
    "self": {"href": "/cs/v2/estates?..."},
    "next": {"href": "..."},
    "prev": {"href": "..."}
  },
  "_embedded": {
    "estates": [...],
    "favourite": {...},
    "note": {...},
    "seller": {...}
  },
  "result_size": 1234,
  "filter": {...}
}
```

### Estate Detail Structure

```json
{
  "_links": {
    "self": {"href": "/cs/v2/estates/123456"},
    "frontend_url": {"href": "/detail/prodej/byt/2+kk/..."}
  },
  "_embedded": {
    "images": [{
      "_links": {
        "self": {"href": "https://...jpg"},
        "dynamicDown": {"href": "https://.../{width},{height}"},
        "dynamicUp": {"href": "https://..."}
      },
      "kind": 1
    }],
    "seller": {...},
    "video_spl": {...},
    "favourite": {"is_favourite": false},
    "note": {"has_note": false, "note": null}
  },
  "name": {"value": "Prodej bytu 2+kk"},
  "locality": {"value": "Praha 1 - Staré Město"},
  "price_czk": {"value": "5 000 000", "unit": "Kč"},
  "text": {"value": "Description..."},
  "items": [
    {"name": "Plocha", "value": "50 m²"},
    {"name": "ID zakázky", "value": "12345"}
  ],
  "map": {
    "lat": 50.0875,
    "lon": 14.4214,
    "zoom": 14,
    "type": "point",
    "geometry": [...]
  },
  "poi": [...],
  "seo": {"category_sub_cb": "..."},
  "is_topped": false,
  "is_topped_today": false
}
```

## Category Codes

Main categories (`category_main_cb`):
- 1 = Byty (Apartments)
- 2 = Domy (Houses)
- 3 = Pozemky (Land)
- 4 = Komerční (Commercial)
- 5 = Ostatní (Other)

Transaction types (`category_type_cb`):
- 1 = Prodej (Sale)
- 2 = Pronájem (Rent)
- 3 = Dražby (Auctions)
- 4 = Podíly (Shares)

## Sort Options

| Value | Description |
|-------|-------------|
| 0 | Newest first (default) |
| 1 | Cheapest first |
| 2 | Most expensive first |
| 4 | Nearest (requires GPS) |

## Image URLs

Dynamic image sizing using template URLs:
- Replace `{width},{height}` in URL for desired dimensions
- Example: `https://d18-a.sdn.cz/d_18/c_img_QM_La/xyz.jpeg?fl=res,{width},{height},3`

## Example Requests

### Search apartments for sale in Prague

```bash
curl "https://www.sreality.cz/api/cs/v2/estates?category_main_cb=1&category_type_cb=1&locality_region_id=10&sort=0&per_page=20" \
  -H "User-Agent: Mozilla/5.0"
```

### Get property detail

```bash
curl "https://www.sreality.cz/api/cs/v2/estates/2916534876" \
  -H "User-Agent: Mozilla/5.0"
```

### Search locations

```bash
curl "https://www.sreality.cz/api/cs/v2/suggest?phrase=Praha&category=region_cz,district_cz,municipality_cz&locality_country_id=112&count=10"
```

### Get filters configuration

```bash
curl "https://www.sreality.cz/api/cs/v2/filters"
```

## Notes

- API is publicly accessible without authentication for read operations
- Authentication (Seznam.cz account) required for favorites, notes, saved searches
- Rate limiting may apply (not documented in app)
- Responses are in Czech language by default
- Timeout configured at 30 seconds for connections
