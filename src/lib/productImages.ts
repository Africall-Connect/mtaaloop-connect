/**
 * Centralized product image resolver.
 *
 * Resolution order:
 *   1. Real product image_url (if it looks usable — i.e. http(s) URL, not base64, not random/broken).
 *   2. Product NAME keyword match (e.g. "Chicken Wings", "Red Wine", "Colgate", "Power Bank", "Roses").
 *   3. SUBCATEGORY match (e.g. "Beer", "Indoor Plants", "Phone Cases").
 *   4. CATEGORY match (handles both display names "Liquor Store" and slug "liquor-store").
 *   5. Generic safe product fallback.
 *
 * Always returns a stable Unsplash-hosted image URL so cards never look "weird".
 */

// Generic safe fallback (clean product photo)
const GENERIC_FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop";

// ── Per-category catalog images ─────────────────────────────────────────────
const CATEGORY_IMAGES: Record<string, string> = {
  // Inventory
  "food & drinks":
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop",
  "living essentials":
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop",
  "groceries & food":
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
  "groceries & essentials":
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=400&fit=crop",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
  "liquor store":
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop",
  "flowers & gifts":
    "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop",
  butchery:
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop",
  "mobile accessories":
    "https://images.unsplash.com/photo-1592434134753-a70baf7979d5?w=400&h=400&fit=crop",
  // Service
  "utilities & services":
    "https://images.unsplash.com/photo-1585687433448-e0d7cba3c0a5?w=400&h=400&fit=crop",
  "home services":
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=400&fit=crop",
  // Booking
  "beauty & spa":
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
  accommodation:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop",
  // Pharmacy
  pharmacy:
    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop",
};

// Slug → canonical name mapping so "liquor-store" === "Liquor Store"
const SLUG_TO_CATEGORY: Record<string, string> = {
  "food-drinks": "food & drinks",
  "living-essentials": "living essentials",
  "groceries-food": "groceries & food",
  "groceries-essentials": "groceries & essentials",
  restaurant: "restaurant",
  "liquor-store": "liquor store",
  "flowers-gifts": "flowers & gifts",
  butchery: "butchery",
  "mobile-accessories": "mobile accessories",
  "utilities-services": "utilities & services",
  "home-services": "home services",
  "beauty-spa": "beauty & spa",
  accommodation: "accommodation",
  pharmacy: "pharmacy",
};

// ── Per-subcategory images ──────────────────────────────────────────────────
const SUBCATEGORY_IMAGES: Record<string, string> = {
  // Butchery
  beef: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop",
  "goat & mutton":
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop",
  pork: "https://images.unsplash.com/photo-1602470521006-13cb3da3a2ae?w=400&h=400&fit=crop",
  "chicken (broiler)":
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop",
  chicken:
    "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop",
  "minced meat":
    "https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop",
  "offal & specialty":
    "https://images.unsplash.com/photo-1597712050037-4e6e3b4c6e8a?w=400&h=400&fit=crop",
  "soup bones":
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop",
  "sausages & smoked":
    "https://images.unsplash.com/photo-1601924638867-3a6de6b7a500?w=400&h=400&fit=crop",

  // Liquor
  beer: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop",
  "local beer":
    "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=400&h=400&fit=crop",
  "imported beer":
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop",
  stout:
    "https://images.unsplash.com/photo-1571613914063-396c4ddb3ee8?w=400&h=400&fit=crop",
  cider:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop",
  "red wine":
    "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=400&fit=crop",
  "white wine":
    "https://images.unsplash.com/photo-1566995541428-f2c4be0a9a83?w=400&h=400&fit=crop",
  champagne:
    "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=400&fit=crop",
  "champagne & sparkling":
    "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=400&fit=crop",
  spirits:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop",
  spirit:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop",
  "whiskey & bourbon":
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop",
  whiskey:
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop",
  whisky:
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop",
  bourbon:
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop",
  vodka:
    "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=400&h=400&fit=crop",
  gin: "https://images.unsplash.com/photo-1605989993128-2d4d6f9da30c?w=400&h=400&fit=crop",
  rum: "https://images.unsplash.com/photo-1598631982081-1f48f0a8e4e6?w=400&h=400&fit=crop",
  tequila:
    "https://images.unsplash.com/photo-1656149571913-0353a4ed8ec0?w=400&h=400&fit=crop",
  brandy:
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop",
  cognac:
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop",
  liqueur:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop",
  miniatures:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop",
  "ready-to-drink (rtds)":
    "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop",
  rtd: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop",
  "mixers & soft drinks":
    "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
  mixer:
    "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
  "energy drink":
    "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=400&fit=crop",
  snacks:
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop",
  tobacco:
    "https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=400&h=400&fit=crop",

  // Flowers & Gifts
  "fresh flowers":
    "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop",
  bouquets:
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop",
  "indoor plants":
    "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop",
  "gift baskets & hampers":
    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop",
  "cake & pastries":
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop",
  "custom arrangements":
    "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=400&h=400&fit=crop",
  "event decorations":
    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop",

  // Mobile Accessories
  "phone cases":
    "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop",
  "screen protectors":
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=400&fit=crop",
  "chargers & cables":
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop",
  "power banks":
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",
  "headphones & earbuds":
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
  "bluetooth speakers":
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
  "memory cards":
    "https://images.unsplash.com/photo-1620828107226-2a1b6c5f4cc7?w=400&h=400&fit=crop",
  "phone holders & mounts":
    "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=400&h=400&fit=crop",
  "replacement batteries":
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop",

  // Living essentials / groceries-essentials toiletries
  "bar soap":
    "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop",
  "body wash":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
  "body lotion":
    "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=400&h=400&fit=crop",
  shampoo:
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop",
  conditioner:
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop",
  deodorant:
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
  "oral care":
    "https://images.unsplash.com/photo-1559591937-abc3a5af7ec4?w=400&h=400&fit=crop",
  shaving:
    "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=400&h=400&fit=crop",
  "feminine care":
    "https://images.unsplash.com/photo-1607006677019-7b6a4ea3d4f1?w=400&h=400&fit=crop",
  "baby care":
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop",
  "toiletries & personal hygiene":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
  "skincare & grooming":
    "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=400&h=400&fit=crop",
  "health & first aid":
    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop",
  "cleaning supplies":
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=400&fit=crop",
  "household essentials":
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop",
  "household supplies":
    "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop",

  // Pharmacy
  "prescription medicine":
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop",
  "over-the-counter medicine":
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop",
  "family planning":
    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop",
  "first aid supplies":
    "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop",
  "vitamins & supplements":
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
  "personal hygiene":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
  "medical devices":
    "https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=400&h=400&fit=crop",
  consultation:
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop",

  // Groceries & Food
  "fresh produce":
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
  fruits:
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop",
  vegetables:
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop",
  "meat & poultry":
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop",
  fish: "https://images.unsplash.com/photo-1559737558-2f5a35f4523d?w=400&h=400&fit=crop",
  "dairy & eggs":
    "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400&h=400&fit=crop",
  "bread & bakery":
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
  "snacks & confectionery":
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop",
};

// ── Product NAME keyword rules (most specific first) ────────────────────────
type Rule = { test: RegExp; image: string };

const NAME_RULES: Rule[] = [
  // Beverages — beer brands
  { test: /\b(tusker|whitecap|guinness|heineken|budweiser|corona|pilsner|balozi|smirnoff ice|carlsberg)\b/i,
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop" },
  { test: /\bstout\b/i,
    image: "https://images.unsplash.com/photo-1571613914063-396c4ddb3ee8?w=400&h=400&fit=crop" },
  { test: /\bcider\b/i,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
  // Spirits
  { test: /\b(jack daniel|jameson|johnnie walker|chivas|glenlivet|glenfiddich|jw |whiskey|whisky|bourbon)\b/i,
    image: "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop" },
  { test: /\bvodka\b/i,
    image: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=400&h=400&fit=crop" },
  { test: /\bgin\b/i,
    image: "https://images.unsplash.com/photo-1605989993128-2d4d6f9da30c?w=400&h=400&fit=crop" },
  { test: /\b(rum|bumbu|captain morgan|bacardi)\b/i,
    image: "https://images.unsplash.com/photo-1598631982081-1f48f0a8e4e6?w=400&h=400&fit=crop" },
  { test: /\btequila\b/i,
    image: "https://images.unsplash.com/photo-1656149571913-0353a4ed8ec0?w=400&h=400&fit=crop" },
  { test: /\b(brandy|cognac|hennessy|martell)\b/i,
    image: "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?w=400&h=400&fit=crop" },
  { test: /\b(red wine|cabernet|merlot|shiraz|pinot noir)\b/i,
    image: "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=400&fit=crop" },
  { test: /\b(white wine|chardonnay|sauvignon|riesling)\b/i,
    image: "https://images.unsplash.com/photo-1566995541428-f2c4be0a9a83?w=400&h=400&fit=crop" },
  { test: /\b(champagne|prosecco|sparkling)\b/i,
    image: "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=400&fit=crop" },

  // Soft drinks / mixers
  { test: /\b(coca[- ]?cola|coke|pepsi|fanta|sprite|stoney|krest|schweppes|tonic|soda)\b/i,
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop" },
  { test: /\b(red bull|monster|energy drink|power play)\b/i,
    image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=400&fit=crop" },

  // Tobacco
  { test: /\b(cigarette|marlboro|dunhill|embassy|sportsman|camel|sweet menthol)\b/i,
    image: "https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=400&h=400&fit=crop" },
  { test: /\blighter\b/i,
    image: "https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?w=400&h=400&fit=crop" },

  // Butchery
  { test: /\b(t-bone|steak)\b/i,
    image: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop" },
  { test: /\bbeef (ribs|leg|stew|soup|bones)\b/i,
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
  { test: /\bbeef (mince|ground)\b/i,
    image: "https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop" },
  { test: /\bbeef liver\b/i,
    image: "https://images.unsplash.com/photo-1606851094291-6efae152bb87?w=400&h=400&fit=crop" },
  { test: /\b(kidney|tongue|tripe|heart|gizzard|offal)\b/i,
    image: "https://images.unsplash.com/photo-1597712050037-4e6e3b4c6e8a?w=400&h=400&fit=crop" },
  { test: /\bsausage|hot dog\b/i,
    image: "https://images.unsplash.com/photo-1601924638867-3a6de6b7a500?w=400&h=400&fit=crop" },
  { test: /\bwhole chicken|chicken breast\b/i,
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop" },
  { test: /\bchicken (drumsticks|thighs)\b/i,
    image: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400&h=400&fit=crop" },
  { test: /\bchicken wings\b/i,
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop" },
  { test: /\bchicken mince\b/i,
    image: "https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop" },
  { test: /\b(goat|mutton)\b/i,
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
  { test: /\b(pork ribs|pork chops|pork belly|smoked pork)\b/i,
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
  { test: /\bpork mince\b/i,
    image: "https://images.unsplash.com/photo-1602470521006-2d0f47bb8b48?w=400&h=400&fit=crop" },

  // Flowers
  { test: /\brose(s)?\b/i,
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=400&fit=crop" },
  { test: /\b(lily|lilies)\b/i,
    image: "https://images.unsplash.com/photo-1565011523534-747a8601f10a?w=400&h=400&fit=crop" },
  { test: /\bsunflower\b/i,
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop" },
  { test: /\borchid\b/i,
    image: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=400&h=400&fit=crop" },
  { test: /\btulip\b/i,
    image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop" },
  { test: /\bbouquet\b/i,
    image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop" },
  { test: /\b(snake plant|monstera|cactus|fern|bonsai|aloe|palm|hydrangea)\b/i,
    image: "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop" },
  { test: /\b(hamper|gift basket|gift box)\b/i,
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop" },
  { test: /\b(cake|brownie|cheesecake|pastry|cupcake)\b/i,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop" },

  // Mobile accessories
  { test: /\bpower bank\b/i,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
  { test: /\b(charger|gan|adapter)\b/i,
    image: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&h=400&fit=crop" },
  { test: /\bcable|usb-c|lightning\b/i,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop" },
  { test: /\bcase\b/i,
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop" },
  { test: /\b(earbuds|headphones)\b/i,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop" },
  { test: /\bspeaker\b/i,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop" },
  { test: /\b(screen|tempered glass|protector)\b/i,
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=400&fit=crop" },
  { test: /\b(microsd|sd card|memory card)\b/i,
    image: "https://images.unsplash.com/photo-1620828107226-2a1b6c5f4cc7?w=400&h=400&fit=crop" },
  { test: /\b(mount|stand|holder)\b/i,
    image: "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=400&h=400&fit=crop" },
  { test: /\bbattery\b/i,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },

  // Toiletries & personal hygiene brands
  { test: /\b(colgate|sensodyne|aquafresh|close[- ]?up|toothpaste|toothbrush)\b/i,
    image: "https://images.unsplash.com/photo-1559591937-abc3a5af7ec4?w=400&h=400&fit=crop" },
  { test: /\b(dettol|geisha|imperial leather|dove beauty bar|joy cosmetics).*\bbar\b/i,
    image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
  { test: /\bbar soap\b/i,
    image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&h=400&fit=crop" },
  { test: /\b(body wash|shower gel)\b/i,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop" },
  { test: /\b(nivea|jergens|vaseline|body lotion|body oil)\b/i,
    image: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=400&h=400&fit=crop" },
  { test: /\b(shampoo|pantene|head and shoulders|sunsilk|tresemme|clear men)\b/i,
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
  { test: /\bconditioner\b/i,
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
  { test: /\b(deodorant|axe body spray|rexona|sure)\b/i,
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop" },
  { test: /\b(razor|gillette|bic|veet|shaving foam)\b/i,
    image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=400&h=400&fit=crop" },
  { test: /\b(always|kotex|stayfree|tampax|pads)\b/i,
    image: "https://images.unsplash.com/photo-1607006677019-7b6a4ea3d4f1?w=400&h=400&fit=crop" },
  { test: /\b(huggies|johnsons baby|bepanthen|baby wipes|nappy|diaper)\b/i,
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop" },

  // Pharmacy
  { test: /\b(panadol|paracetamol|ibuprofen|brufen|aspirin|amoxil|amoxicillin|cetrizine|antibiotic|tablet|capsule|syrup)\b/i,
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop" },
  { test: /\bband-?aid|bandage|gauze|first aid\b/i,
    image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop" },
  { test: /\b(vitamin|multivitamin|supplement)\b/i,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop" },
  { test: /\b(thermometer|blood pressure|glucose meter)\b/i,
    image: "https://images.unsplash.com/photo-1584516150909-c43483ee7932?w=400&h=400&fit=crop" },
  { test: /\bconsultation\b/i,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop" },

  // Groceries
  { test: /\b(tomato|onion|carrot|cabbage|kale|sukuma|spinach|pepper|cucumber)\b/i,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop" },
  { test: /\b(banana|mango|apple|orange|pineapple|watermelon|avocado|pawpaw)\b/i,
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=400&fit=crop" },
  { test: /\b(milk|yoghurt|cheese|butter|eggs?)\b/i,
    image: "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=400&h=400&fit=crop" },
  { test: /\b(bread|loaf|chapati|mandazi)\b/i,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" },
  { test: /\b(rice|maize flour|unga|sugar|salt|cooking oil|flour)\b/i,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
const norm = (s?: string | null) => (s || "").trim().toLowerCase();

const isUsableImage = (url?: string | null): boolean => {
  if (!url) return false;
  const u = url.trim();
  if (!u) return false;
  if (u.startsWith("data:")) return false; // base64 — too heavy
  if (/loremflickr|placehold(er)?\.com|via\.placeholder|picsum\.photos/i.test(u)) return false;
  if (!/^https?:\/\//i.test(u)) return false;
  return true;
};

const categoryKey = (category?: string | null): string => {
  const n = norm(category);
  if (!n) return "";
  return SLUG_TO_CATEGORY[n] || n;
};

/**
 * Resolve the best image URL for a product.
 */
export function resolveProductImage(product: {
  image_url?: string | null;
  name?: string | null;
  subcategory?: string | null;
  category?: string | null;
}): string {
  // 1. Use the real image if it's actually usable.
  if (isUsableImage(product.image_url)) return product.image_url as string;

  // 2. Product NAME keyword match.
  const name = product.name || "";
  if (name) {
    for (const rule of NAME_RULES) {
      if (rule.test.test(name)) return rule.image;
    }
  }

  // 3. Subcategory match.
  const sub = norm(product.subcategory);
  if (sub && SUBCATEGORY_IMAGES[sub]) return SUBCATEGORY_IMAGES[sub];

  // 4. Category match.
  const cat = categoryKey(product.category);
  if (cat && CATEGORY_IMAGES[cat]) return CATEGORY_IMAGES[cat];

  // 5. Generic fallback.
  return GENERIC_FALLBACK;
}

/**
 * onError handler: swap a broken/bad src for the best resolved image.
 * Self-disables after one swap to avoid loops.
 */
export function productImageErrorHandler(product: {
  name?: string | null;
  subcategory?: string | null;
  category?: string | null;
}) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.productFallbackApplied === "true") return;
    img.dataset.productFallbackApplied = "true";
    img.src = resolveProductImage({ ...product, image_url: null });
  };
}
