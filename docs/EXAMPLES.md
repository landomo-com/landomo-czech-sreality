# Sreality API Examples

## cURL Examples

### Search apartments for sale in Prague

```bash
curl -s "https://www.sreality.cz/api/cs/v2/estates?category_main_cb=1&category_type_cb=1&locality_region_id=10&per_page=20&sort=0" \
  -H "User-Agent: Mozilla/5.0"
```

### Search 2+kk apartments for rent in Brno, max 15000 CZK

```bash
curl -s "https://www.sreality.cz/api/cs/v2/estates?category_main_cb=1&category_type_cb=2&category_sub_cb=4&locality_region_id=20&price_to=15000&per_page=20" \
  -H "User-Agent: Mozilla/5.0"
```

### Get property detail

```bash
curl -s "https://www.sreality.cz/api/cs/v2/estates/1492152908" \
  -H "User-Agent: Mozilla/5.0"
```

### Get property count

```bash
curl -s "https://www.sreality.cz/api/cs/v2/estates/count?category_main_cb=1&category_type_cb=1&locality_region_id=10" \
  -H "User-Agent: Mozilla/5.0"
```

### Location autocomplete

```bash
curl -s "https://www.sreality.cz/api/cs/v2/suggest?phrase=Praha&category=region_cz,district_cz,municipality_cz&count=10"
```

### Get filter options

```bash
curl -s "https://www.sreality.cz/api/cs/v2/filters"
```

### Get map clusters

```bash
curl -s "https://www.sreality.cz/api/cs/v2/clusters?category_main_cb=1&category_type_cb=1&sw=49.9,14.2&ne=50.2,14.7&zoom=12" \
  -H "User-Agent: Mozilla/5.0"
```

## Python Examples

### Basic property search

```python
import requests

BASE_URL = "https://www.sreality.cz/api/cs/v2"

def search_estates(
    category_main=1,  # apartments
    category_type=1,  # sale
    region_id=10,     # Prague
    per_page=20,
    page=1
):
    params = {
        "category_main_cb": category_main,
        "category_type_cb": category_type,
        "locality_region_id": region_id,
        "per_page": per_page,
        "page": page,
        "sort": 0  # newest first
    }

    response = requests.get(
        f"{BASE_URL}/estates",
        params=params,
        headers={"User-Agent": "Mozilla/5.0"}
    )
    return response.json()

# Usage
data = search_estates()
print(f"Found {data['result_size']} properties")

for estate in data["_embedded"]["estates"]:
    print(f"- {estate['name']} | {estate['locality']} | {estate['price']:,} CZK")
```

### Get all properties with pagination

```python
import requests
import time

BASE_URL = "https://www.sreality.cz/api/cs/v2"

def get_all_estates(params, max_pages=None, delay=1.0):
    """Fetch all estates with pagination."""
    all_estates = []
    page = 1

    while True:
        params["page"] = page

        response = requests.get(
            f"{BASE_URL}/estates",
            params=params,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        data = response.json()

        estates = data.get("_embedded", {}).get("estates", [])
        if not estates:
            break

        all_estates.extend(estates)
        print(f"Page {page}: {len(estates)} estates (total: {len(all_estates)})")

        if max_pages and page >= max_pages:
            break

        # Check if there's more data
        if len(all_estates) >= data.get("result_size", 0):
            break

        page += 1
        time.sleep(delay)  # Be nice to the server

    return all_estates

# Usage
params = {
    "category_main_cb": 1,  # apartments
    "category_type_cb": 2,  # rent
    "locality_region_id": 10,  # Prague
    "price_to": 20000,
    "per_page": 60,
    "sort": 0
}

estates = get_all_estates(params, max_pages=5)
print(f"\nTotal fetched: {len(estates)} estates")
```

### Get property details

```python
import requests

BASE_URL = "https://www.sreality.cz/api/cs/v2"

def get_estate_detail(hash_id):
    """Get detailed information about a property."""
    response = requests.get(
        f"{BASE_URL}/estates/{hash_id}",
        headers={"User-Agent": "Mozilla/5.0"}
    )
    return response.json()

def parse_estate_detail(data):
    """Parse estate detail into a clean dict."""
    return {
        "id": data.get("_links", {}).get("self", {}).get("href", "").split("/")[-1],
        "name": data.get("name", {}).get("value"),
        "locality": data.get("locality", {}).get("value"),
        "price": data.get("price_czk", {}).get("value_raw"),
        "price_formatted": data.get("price_czk", {}).get("value"),
        "description": data.get("text", {}).get("value"),
        "lat": data.get("map", {}).get("lat"),
        "lon": data.get("map", {}).get("lon"),
        "images": [
            img.get("_links", {}).get("self", {}).get("href")
            for img in data.get("_embedded", {}).get("images", [])
        ],
        "seller": data.get("_embedded", {}).get("seller"),
        "items": {
            item["name"]: item["value"]
            for item in data.get("items", [])
        }
    }

# Usage
detail = get_estate_detail(1492152908)
parsed = parse_estate_detail(detail)
print(f"Property: {parsed['name']}")
print(f"Location: {parsed['locality']}")
print(f"Price: {parsed['price_formatted']}")
print(f"Images: {len(parsed['images'])}")
```

### Location search/autocomplete

```python
import requests

BASE_URL = "https://www.sreality.cz/api/cs/v2"

def suggest_location(phrase, country_id=112, count=10):
    """Search for locations by name."""
    params = {
        "phrase": phrase,
        "category": "region_cz,district_cz,municipality_cz,ward_cz,quarter_cz,street_cz",
        "locality_country_id": country_id,
        "count": count
    }

    response = requests.get(f"{BASE_URL}/suggest", params=params)
    data = response.json()

    results = []
    for item in data.get("data", []):
        user_data = item.get("userData", {})
        results.append({
            "name": user_data.get("suggestFirstRow"),
            "location": user_data.get("location"),
            "category": item.get("category"),
            "lat": user_data.get("latitude"),
            "lon": user_data.get("longitude"),
            "region_id": user_data.get("region_id"),
            "district_id": user_data.get("district_id"),
            "municipality_id": user_data.get("id")
        })

    return results

# Usage
locations = suggest_location("Vinohrady")
for loc in locations:
    print(f"{loc['name']} ({loc['category']}) - {loc['location']}")
```

### Export to CSV

```python
import requests
import csv
import time

BASE_URL = "https://www.sreality.cz/api/cs/v2"

def export_estates_to_csv(params, filename, max_pages=10):
    """Export estate search results to CSV."""

    fieldnames = [
        "hash_id", "name", "locality", "price", "price_unit",
        "category", "type", "area", "url", "lat", "lon"
    ]

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        page = 1
        total = 0

        while page <= max_pages:
            params["page"] = page

            response = requests.get(
                f"{BASE_URL}/estates",
                params=params,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            data = response.json()

            estates = data.get("_embedded", {}).get("estates", [])
            if not estates:
                break

            for estate in estates:
                seo = estate.get("seo", {})
                writer.writerow({
                    "hash_id": estate.get("hash_id"),
                    "name": estate.get("name"),
                    "locality": estate.get("locality"),
                    "price": estate.get("price"),
                    "price_unit": estate.get("price_czk", {}).get("unit", ""),
                    "category": seo.get("category_main_cb"),
                    "type": seo.get("category_type_cb"),
                    "area": "",  # Need detail API for this
                    "url": f"https://www.sreality.cz/detail/{estate.get('hash_id')}",
                    "lat": estate.get("gps", {}).get("lat", ""),
                    "lon": estate.get("gps", {}).get("lon", "")
                })
                total += 1

            print(f"Page {page}: exported {len(estates)} ({total} total)")

            if total >= data.get("result_size", 0):
                break

            page += 1
            time.sleep(1)

    print(f"Exported {total} estates to {filename}")

# Usage
params = {
    "category_main_cb": 1,
    "category_type_cb": 1,
    "locality_region_id": 10,
    "per_page": 60
}

export_estates_to_csv(params, "prague_apartments_sale.csv", max_pages=5)
```

## Response Parsing Tips

### Extract images with proper URLs

```python
def get_image_urls(estate_detail, size="800,600"):
    """Extract image URLs at specified size."""
    images = estate_detail.get("_embedded", {}).get("images", [])
    urls = []

    for img in images:
        links = img.get("_links", {})

        # Prefer dynamicDown for resizable images
        dynamic = links.get("dynamicDown", {}).get("href")
        if dynamic and "{width},{height}" in dynamic:
            urls.append(dynamic.replace("{width},{height}", size))
        else:
            # Fallback to self link
            self_url = links.get("self", {}).get("href")
            if self_url:
                urls.append(self_url)

    return urls
```

### Handle pagination with HAL links

```python
def get_next_page_url(response_data):
    """Extract next page URL from HAL response."""
    links = response_data.get("_links", {})
    next_link = links.get("next", {})
    return next_link.get("href")

def fetch_all_with_hal(initial_url):
    """Fetch all pages following HAL next links."""
    all_items = []
    url = initial_url

    while url:
        response = requests.get(
            f"https://www.sreality.cz{url}" if url.startswith("/") else url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        data = response.json()

        estates = data.get("_embedded", {}).get("estates", [])
        all_items.extend(estates)

        url = get_next_page_url(data)
        time.sleep(1)

    return all_items
```
