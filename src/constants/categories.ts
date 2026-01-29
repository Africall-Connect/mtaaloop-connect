// Category and Subcategory Constants
// Mirrors src/lib/categories.ts for consistency

// ============= Main Categories (for dropdowns with label/value format) =============
export const MAIN_CATEGORIES = [
  // Inventory
  { value: "Food & Drinks", label: "Food & Drinks" },
  { value: "Living Essentials", label: "Living Essentials" },
  { value: "Groceries & Food", label: "Groceries & Food" },
  { value: "Restaurant", label: "Restaurant" },
  // Service
  { value: "Utilities & Services", label: "Utilities & Services" },
  { value: "Home Services", label: "Home Services" },
  // Booking
  { value: "Beauty & Spa", label: "Beauty & Spa" },
  { value: "Accommodation", label: "Accommodation" },
  // Pharmacy (Hybrid)
  { value: "Pharmacy", label: "Pharmacy" },
];

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
    "Consultation",
    "Prescription Medicine",
    "Over-the-Counter Medicine",
    "Family Planning",
    "First Aid Supplies",
    "Vitamins & Supplements",
    "Baby Care",
    "Personal Hygiene",
    "Medical Devices",
  ],
};
