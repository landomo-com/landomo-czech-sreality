# Sreality Category & Region Codes

## Main Categories (`category_main_cb`)

| Code | Czech | English |
|------|-------|---------|
| 1 | Byty | Apartments |
| 2 | Domy | Houses |
| 3 | Pozemky | Land |
| 4 | Komerční | Commercial |
| 5 | Ostatní | Other |

## Transaction Types (`category_type_cb`)

| Code | Czech | English |
|------|-------|---------|
| 1 | Prodej | Sale |
| 2 | Pronájem | Rent |
| 3 | Dražby | Auctions |
| 4 | Podíly | Shares |

## Apartment Sub-Categories (`category_sub_cb` for `category_main_cb=1`)

| Code | Type |
|------|------|
| 2 | 1+kk |
| 3 | 1+1 |
| 4 | 2+kk |
| 5 | 2+1 |
| 6 | 3+kk |
| 7 | 3+1 |
| 8 | 4+kk |
| 9 | 4+1 |
| 10 | 5+kk |
| 11 | 5+1 |
| 12 | 6+ |
| 16 | Atypický |
| 47 | Pokoj (Room) |

## House Sub-Categories (`category_sub_cb` for `category_main_cb=2`)

| Code | Type |
|------|------|
| 37 | Rodinný (Family house) |
| 39 | Vila |
| 43 | Chalupa (Cottage) |
| 33 | Chata (Cabin) |
| 35 | Na klíč (Turnkey) |
| 40 | Zemědělská usedlost (Farm) |
| 44 | Památka/jiné (Monument/other) |

## Land Sub-Categories (`category_sub_cb` for `category_main_cb=3`)

| Code | Type |
|------|------|
| 19 | Bydlení (Residential) |
| 18 | Komerční (Commercial) |
| 20 | Pole (Field) |
| 22 | Louky (Meadow) |
| 21 | Lesy (Forest) |
| 46 | Rybníky (Ponds) |
| 48 | Sady/vinice (Orchards/vineyards) |
| 23 | Zahrady (Gardens) |
| 24 | Ostatní (Other) |

## Commercial Sub-Categories (`category_sub_cb` for `category_main_cb=4`)

| Code | Type |
|------|------|
| 25 | Kanceláře (Offices) |
| 26 | Sklady (Warehouses) |
| 27 | Výroba (Production) |
| 28 | Obchodní prostory (Retail) |
| 29 | Ubytování (Accommodation) |
| 30 | Restaurace (Restaurant) |
| 31 | Zemědělský (Agricultural) |
| 38 | Činžovní dům (Apartment building) |
| 32 | Ostatní (Other) |

## Sort Options (`sort`)

| Code | Description |
|------|-------------|
| 0 | Nejnovější (Newest first) - default |
| 1 | Nejlevnější (Cheapest first) |
| 2 | Nejdražší (Most expensive first) |
| 4 | Nejbližší (Nearest) - requires `gps` param |

## Country Codes (`locality_country_id`)

| Code | Country |
|------|---------|
| 112 | Česká republika (Czech Republic) |
| 10000 | Zahraničí - vše (All abroad) |
| 10001 | Slovensko (Slovakia) |

## Czech Region Codes (`locality_region_id`)

| Code | Region |
|------|--------|
| 10 | Praha (Prague) |
| 11 | Středočeský kraj |
| 12 | Jihočeský kraj |
| 13 | Plzeňský kraj |
| 14 | Karlovarský kraj |
| 15 | Ústecký kraj |
| 16 | Liberecký kraj |
| 17 | Královéhradecký kraj |
| 18 | Pardubický kraj |
| 19 | Vysočina |
| 20 | Jihomoravský kraj |
| 21 | Olomoucký kraj |
| 22 | Zlínský kraj |
| 23 | Moravskoslezský kraj |

## Prague District Codes (`locality_district_id` when `locality_region_id=10`)

| Code | District |
|------|----------|
| 5001 | Praha 1 |
| 5002 | Praha 2 |
| 5003 | Praha 3 |
| 5004 | Praha 4 |
| 5005 | Praha 5 |
| 5006 | Praha 6 |
| 5007 | Praha 7 |
| 5008 | Praha 8 |
| 5009 | Praha 9 |
| 5010 | Praha 10 |
| 5011 | Praha-východ |
| 5012 | Praha-západ |

## Property Features/Labels

Common labels found in `labels` and `labelsAll` arrays:

| Key | Czech | English |
|-----|-------|---------|
| `balcony` | Balkon | Balcony |
| `terrace` | Terasa | Terrace |
| `cellar` | Sklep | Cellar |
| `garage` | Garáž | Garage |
| `parking` | Parkování | Parking |
| `garden` | Zahrada | Garden |
| `elevator` | Výtah | Elevator |
| `personal` | Osobní vlastnictví | Personal ownership |
| `brick` | Cihlová stavba | Brick building |
| `panel` | Panelová stavba | Panel building |
| `new_building` | Novostavba | New building |

## Image Sizes

Dynamic image URLs support `{width},{height}` replacement:

| Size | Usage |
|------|-------|
| `200,200` | Thumbnail |
| `400,300` | List view |
| `800,600` | Detail view |
| `1280,960` | Full size |
