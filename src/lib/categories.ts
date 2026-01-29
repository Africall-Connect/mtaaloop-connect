// Centralized category and subcategory constants
// New streamlined structure with 9 main categories across 4 operational types

// ============= Inventory Categories (5) =============
export const INVENTORY_CATEGORIES = [
  "Food & Drinks",
  "Living Essentials",
  "Groceries & Food",
  "Restaurant",
  "Liquor Store",
] as const;

// ============= Service Categories (2) =============
export const SERVICE_CATEGORIES = [
  "Utilities & Services",
  "Home Services",
] as const;

// ============= Booking Categories (2) =============
export const BOOKING_CATEGORIES = [
  "Beauty & Spa",
  "Accommodation",
] as const;

// ============= Pharmacy Category (1 - Hybrid: Inventory + Booking) =============
export const PHARMACY_CATEGORIES = [
  "Pharmacy",
] as const;

// ============= All Main Categories (10 total) =============
export const MAIN_CATEGORIES = [
  // Inventory
  "Food & Drinks",
  "Living Essentials",
  "Groceries & Food",
  "Restaurant",
  "Liquor Store",
  // Service
  "Utilities & Services",
  "Home Services",
  // Booking
  "Beauty & Spa",
  "Accommodation",
  // Pharmacy (Hybrid)
  "Pharmacy",
] as const;

// ============= Subcategory Options =============
export const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  // Inventory Subcategories
  "Food & Drinks": [
    "Fast Food",
    "Traditional Food",
    "Cafes & Coffee Shops",
    "Bakery & Pastries",
    "International Cuisine",
    "Pizza",
    "Burgers & Sandwiches",
    "Chicken & Wings",
    "Seafood",
    "Vegetarian & Vegan",
    "Juice Bar & Smoothies",
    "Ice Cream",
    "Liquor",
  ],

  "Living Essentials": [
    "Toiletries & Personal Hygiene",
    "Skincare & Grooming",
    "Health & First Aid",
    "Cleaning Supplies",
    "Household Essentials",
  ],

  "Groceries & Food": [
    "Fresh Produce",
    "Fruits",
    "Vegetables",
    "Meat & Poultry",
    "Fish",
    "Dairy & Eggs",
    "Bread & Bakery",
    "Snacks & Confectionery",
  ],

  // Restaurant - Empty array, vendors create custom subcategories
  "Restaurant": [],

  // Liquor Store Subcategories
  "Liquor Store": [
    "Beer",
    "Wine",
    "Spirits",
    "Whiskey & Bourbon",
    "Vodka",
    "Gin",
    "Rum",
    "Tequila",
    "Champagne & Sparkling",
    "Ready-to-Drink (RTDs)",
    "Mixers & Soft Drinks",
  ],

  // Service Subcategories
  "Utilities & Services": [
    "Gas Delivery",
    "Water Delivery",
  ],

  "Home Services": [
    "Cleaning Services",
    "Laundry Services",
    "Electrical",
  ],

  // Booking Subcategories
  "Beauty & Spa": [
    "Hair Salon",
    "Barber",
    "Nail Salon",
    "Massage",
    "Facial",
    "Makeup Service",
    "Bridal Package",
  ],

  "Accommodation": [
    "Guest Houses",
    "Airbnb",
    "Rentals",
  ],

  // Pharmacy - Hybrid (Inventory + Booking)
  "Pharmacy": [
    "Consultation",           // Booking
    "Prescription Medicine",   // Inventory
    "Over-the-Counter Medicine", // Inventory
    "Family Planning",         // Inventory
    "First Aid Supplies",      // Inventory
    "Vitamins & Supplements",  // Inventory
    "Baby Care",               // Inventory
    "Personal Hygiene",        // Inventory
    "Medical Devices",         // Inventory
  ],
};

// ============= Helper: Get operational type for a category =============
export const getOperationalType = (category: string): 'inventory' | 'service' | 'booking' | 'pharmacy' | null => {
  if ((INVENTORY_CATEGORIES as readonly string[]).includes(category)) return 'inventory';
  if ((SERVICE_CATEGORIES as readonly string[]).includes(category)) return 'service';
  if ((BOOKING_CATEGORIES as readonly string[]).includes(category)) return 'booking';
  if ((PHARMACY_CATEGORIES as readonly string[]).includes(category)) return 'pharmacy';
  return null;
};

// ============= Exports =============
export default {
  MAIN_CATEGORIES,
  INVENTORY_CATEGORIES,
  SERVICE_CATEGORIES,
  BOOKING_CATEGORIES,
  PHARMACY_CATEGORIES,
  SUBCATEGORY_OPTIONS,
  getOperationalType,
};
