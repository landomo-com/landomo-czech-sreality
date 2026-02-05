# Sreality API Endpoints Reference

Base URL: `https://www.sreality.cz/api/cs/v2`

## Quick Reference

### Property Search
```
GET /estates
GET /estates/count
GET /estates/{hash_id}
GET /estate-iterator/{position}
```

### Projects (New Developments)
```
GET /projects
GET /projects/count
GET /project-iterator/{position}
```

### Configuration
```
GET /filters
GET /project-filters
```

### Map
```
GET /clusters
```

### Search/Autocomplete
```
GET /suggest
```

### Homepage
```
GET /hp
```

### Contact
```
POST /email-query
POST /email-seller
```

### Mobile/Push (Authenticated)
```
POST /mobile_device/gcm/{fcm_token}
PUT  /mobile_device/{device_hash}/{fcm_token}
GET  /mobile_device/{device_hash}
```

## Endpoint Details

### GET /estates

Search for properties.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `category_main_cb` | int | Main category | `1` |
| `category_type_cb` | int | Transaction type | `1` |
| `locality_region_id` | int | Region ID | `10` |
| `locality_district_id` | int | District ID | `5001` |
| `locality_country_id` | int | Country ID | `112` |
| `price_from` | int | Minimum price | `1000000` |
| `price_to` | int | Maximum price | `5000000` |
| `usable_area` | string | Area range (pipe-separated) | `50\|100` |
| `sort` | int | Sort order | `0` |
| `per_page` | int | Results per page | `20` |
| `page` | int | Page number | `1` |
| `gps` | string | GPS for distance sort | `50.08\|14.42` |

**Response:**
```json
{
  "result_size": 4045,
  "_embedded": {
    "estates": [...]
  },
  "_links": {
    "self": {"href": "..."},
    "next": {"href": "..."}
  }
}
```

### GET /estates/{hash_id}

Get property detail by hash ID.

**Response:**
```json
{
  "name": {"value": "Prodej bytu 2+kk"},
  "locality": {"value": "Praha 1"},
  "price_czk": {"value": "5 000 000", "unit": "Kč"},
  "text": {"value": "Description..."},
  "map": {"lat": 50.08, "lon": 14.42, "zoom": 14},
  "items": [...],
  "_embedded": {
    "images": [...],
    "seller": {...}
  }
}
```

### GET /suggest

Location autocomplete.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `phrase` | string | Search text |
| `category` | string | Location types (comma-separated) |
| `locality_country_id` | int | Country filter |
| `count` | int | Max results |

**Category Values:**
- Czech: `region_cz,district_cz,municipality_cz,ward_cz,quarter_cz,street_cz`
- Slovak: `region_sk,district_sk,municipality_sk,ward_sk,quarter_sk,street_sk`
- Foreign: `muni_osm`

### GET /clusters

Map markers clustered by zoom level.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sw` | string | Southwest corner (lat,lon) |
| `ne` | string | Northeast corner (lat,lon) |
| `zoom` | int | Map zoom level |
| + all `/estates` filters | | |

### GET /filters

Get available filter options and their values.

**Response:**
```json
{
  "filters": {...},
  "linked_filters": {...},
  "blended": [...]
}
```

### POST /email-query

Send inquiry about a property.

**Request Body:**
```json
{
  "agree_to_terms": true,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+420123456789",
  "text": "I am interested in this property...",
  "hash_id": 1234567890
}
```
