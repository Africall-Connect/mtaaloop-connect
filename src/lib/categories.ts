// Centralized category and subcategory constants extracted from CategoryManagement
// This keeps component files clean and avoids Fast Refresh issues caused by
// exporting non-component values from a component file.

export const INVENTORY_CATEGORIES = [
  "Food & Drinks",
  "Shopping",
  "Living Essentials",
  "Special Occasions",
] as const;

export const SERVICE_CATEGORIES = [
  "Home Services",
  "Transport & Car",
  "Beauty & Spa",
] as const;

export const BOOKING_CATEGORIES = [
  "Health & Wellness",
  "Beauty & Spa",
  "Special Occasions",
  "Accommodation",
] as const;

export const MAIN_CATEGORIES = [
  "Food & Drinks",
  "Shopping",
  "Health & Wellness",
  "Beauty & Spa",
  "Home Services",
  "Transport & Car",
  "Living Essentials",
  "Special Occasions",
] as const;

export const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  "Food & Drinks": [
    "Fast Food",
    "Restaurants",
    "Cafes & Coffee Shops",
    "Bakery & Pastries",
    "Traditional Food",
    "International Cuisine",
    "Pizza & Pasta",
    "Burgers & Sandwiches",
    "Chicken & Wings",
    "Seafood",
    "Vegetarian & Vegan",
    "Juice Bar & Smoothies",
    "Tea & Coffee",
    "Desserts & Ice Cream",
  ],

  "Groceries & Essentials": [
    "Supermarkets",
    "Mini Marts",
    "Fresh Produce",
    "Fruits",
    "Vegetables",
    "Meat & Poultry",
    "Fish & Seafood",
    "Dairy & Eggs",
    "Bread & Bakery",
    "Cereals & Breakfast",
    "Canned & Packaged Foods",
    "Snacks & Confectionery",
    "Beverages & Drinks",
    "Frozen Foods",
  ],

  "Health & Wellness": [
    "Pharmacies & Drugstores",
    "Medical Consultation",
    "General Practitioner",
    "Specialist Doctors",
    "Dental Services",
    "Optical & Eye Care",
    "Physiotherapy",
    "Mental Health Services",
    "Therapy",
    "Nutrition & Dietetics",
    "Vaccination Services",
  ],

  "Beauty & Spa": [
    "Hair Salons",
    "Nail Salons",
    "Spa Services",
    "Massage",
    "Facials",
    "Makeup Services",
    "Waxing & Threading",
    "Skin Care",
    "Bridal Packages",
  ],

  "Auto Services": [
    "Car Wash & Detailing",
    "Auto Repair & Maintenance",
    "Tire Services",
    "Battery Services",
    "Oil Change",
    "AC Services",
    "Tow & Recovery",
  ],

  "Liquor Store": [
    "Beer",
    "Wine",
    "Spirits",
    "Mixers",
    "Gift Sets",
  ],

  "Home Services": [
    "Cleaning Services",
    "Laundry Services",
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Appliance Repair",
    "Gardening & Landscaping",
  ],

  "Repairs & Maintenance": [
    "Electronics Repair",
    "Phone Repair",
    "Appliance Repair",
    "Furniture Repair",
    "Locksmith",
  ],

  "Fashion & Clothing": [
    "Men's Clothing",
    "Women's Clothing",
    "Children's Clothing",
    "Shoes & Footwear",
    "Accessories",
  ],

  "Electronics & Gadgets": [
    "Mobile Phones",
    "Computers & Laptops",
    "Audio",
    "Cameras",
    "Smartwatches",
  ],

  "Groceries": [
    "Supermarkets",
    "Mini Marts",
    "Fresh Produce",
  ],

  "Fitness & Sports": [
    "Gyms & Fitness Centers",
    "Personal Training",
    "Yoga",
    "Sports Equipment",
  ],

  "Education & Tutoring": [
    "Private Tutoring",
    "Music Lessons",
    "Language Classes",
    "Driving School",
  ],

  "Events & Entertainment": [
    "Event Planning",
    "Photography & Videography",
    "DJs & Live Bands",
    "Venue Rental",
  ],

  "Professional Services": [
    "Legal Services",
    "Accounting",
    "Marketing & Advertising",
    "IT Services",
  ],

  "Pet Services": [
    "Pet Shops",
    "Veterinary Services",
    "Pet Grooming",
    "Dog Walking",
  ],

  "Home & Garden": [
    "Furniture",
    "Home Decor",
    "Kitchenware",
    "Garden Supplies",
  ],

  "Books & Stationery": [
    "Books",
    "School Supplies",
    "Office Supplies",
  ],

  "Baby & Kids": [
    "Baby Clothing",
    "Toys & Games",
    "Baby Care Products",
  ],

  "Transport & Logistics": [
    "Taxi & Ride Hailing",
    "Courier Services",
    "Car Rental",
  ],

  "Accommodation": [
    "Hotels",
    "Guest Houses",
    "Airbnb",
  ],

  "Flowers & Gifts": [
    "Flower Shops",
    "Gifts",
    "Bouquets",
  ],

  "Utilities & Services": [
    "Mobile Money",
    "Bill Payments",
    "Gas Delivery",
  ],

  "Security Services": [
    "Security Guards",
    "CCTV Installation",
  ],

  "Religious Services": [
    "Churches",
    "Mosques",
  ],

  "Creative Services": [
    "Graphic Design",
    "Web Design",
    "Video Editing",
  ],

  "Construction Services": [
    "General Contractors",
    "Painting",
  ],

  "Agriculture & Farming": [
    "Fresh Farm Produce",
    "Seeds & Seedlings",
  ],

  "Waste & Recycling": [
    "Garbage Collection",
    "Recycling Services",
  ],

  "Wedding Services": [
    "Wedding Planning",
    "Wedding Dresses",
  ],

  "Special Occasions": [
    "Birthday Parties",
    "Anniversary Celebrations",
    "Baby Showers",
    "Graduation Parties",
    "Corporate Events",
  ],

  // Additional arrays from the landing attachments
  "Shopping": [
    "Groceries",
    "Supermarkets",
    "Mini Marts",
    "Liquor & Wine",
    "Fashion & Clothing",
    "Shoes & Footwear",
    "Accessories & Jewelry",
    "Electronics & Gadgets",
    "Homewares",
    "Pharmacy & Health Products",
    "Beauty & Cosmetics",
    "Stationery & Office Supplies",
  ],

  "Transport & Car": [
    "Car Wash & Detailing",
    "Car Hire & Rental",
    "Taxi & Ride Hailing",
    "Motorcycle Taxi",
    "Courier & Delivery",
    "Vehicle Repairs & Maintenance",
    "Towing Services",
    "Car Accessories",
  ],

  "Living Essentials": [
    "Water Delivery",
    "Gas Delivery (LPG)",
    "House Hunting & Rentals",
    "Airbnb & Short-Term Rentals",
    "Utilities (Electricity, Water)",
    "Household Supplies",
    "Laundry & Dry Cleaning",
  ],
};

export default {
  MAIN_CATEGORIES,
  INVENTORY_CATEGORIES,
  SERVICE_CATEGORIES,
  BOOKING_CATEGORIES,
  SUBCATEGORY_OPTIONS,
};
