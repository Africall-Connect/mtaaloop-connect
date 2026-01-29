import React from "react";
import { ShoppingBag, Package, Leaf, Carrot, Apple, Soup, UtensilsCrossed, Coffee } from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  rating: number;
  ordersThisWeek: number;
  isNew?: boolean;
  isPopular?: boolean;
  originalPrice?: number;
  discount?: number;
  customizations?: {
    spiceLevels?: string[];
    proteins?: { name: string; price: number }[];
    sides?: { name: string; price: number }[];
  };
}

export interface VendorCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon: string | React.ComponentType;
  productCount: number;
  subcategories?: VendorSubcategory[];
}

export interface VendorSubcategory {
  id: string;
  slug: string;
  name: string;
  icon: string | React.ComponentType;
  productCount: number;
  filters?: VendorFilter[];
}

export interface VendorFilter {
  id: string;
  name: string;
  options: string[];
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  distance: string;
  location?: string;
  deliveryTime: string;
  deliveryFee: number;
  isVerified: boolean;
  isLive: boolean;
  isOpen?: boolean;
  openHours: string;
  categories: string[];
  vendorCategories?: VendorCategory[];
  images: string[];
  menu: MenuItem[];
  popularProducts?: MenuItem[];
  certifications: string[];
  yearsInBusiness?: number;
  inEstate?: boolean;
}

export const vendors: Vendor[] = [
  {
    id: "traditional-stews",
    slug: "traditional-stews",
    name: "Traditional Stews & Preparations",
    logo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
    tagline: "Authentic Kenyan Home Cooking",
    description:
      "Authentic Kenyan food cooked with traditional methods passed down through generations. We source fresh ingredients daily from local farmers.",
    rating: 4.9,
    reviewCount: 234,
    distance: "200m",
    location: "Royal Suburbs Phase 2, Unit 104",
    deliveryTime: "5-7 min",
    deliveryFee: 50,
    isVerified: true,
    isLive: true,
    isOpen: true,
    openHours: "Mon-Sun, 7am-9pm",
    categories: ["Food & Drinks", "Traditional Kenyan Food"],
    vendorCategories: [
      {
        id: "main-dishes",
        slug: "main-dishes",
        name: "Main Dishes",
        description: "Traditional Kenyan meals",
        icon: Soup,
        productCount: 12,
        subcategories: [
          {
            id: "rice-based",
            slug: "rice-based",
            name: "Rice & Grains",
            icon: Package,
            productCount: 5,
          },
          {
            id: "stews",
            slug: "stews",
            name: "Stews",
            icon: Soup,
            productCount: 7,
          },
        ],
      },
      {
        id: "sides",
        slug: "sides",
        name: "Sides & Extras",
        icon: Carrot,
        productCount: 8,
      },
    ],
    images: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
    ],
    certifications: ["Hygiene Certified", "Food Safety Verified", "Top Rated Vendor 2024"],
    yearsInBusiness: 8,
    inEstate: true,
    menu: [
      {
        id: "ugali-stew",
        name: "Ugali with Beef Stew",
        description:
          "A Kenyan staple: maize flour cooked to a dough-like consistency, served with a rich beef stew.",
        price: 650,
        image:
          "https://images.unsplash.com/photo-1630434515043-5f9e569393f0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTh8fGtlbnlhbiUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
        category: "Main Dishes",
        rating: 4.8,
        ordersThisWeek: 67,
        isPopular: true,
      },
      {
        id: "mukimo",
        name: "Mukimo",
        description:
          "Mashed potatoes, green peas, corn, and pumpkin leaves. A hearty and flavorful vegetarian dish.",
        price: 500,
        image:
          "https://images.unsplash.com/photo-1608227453941-091a9536904f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGtlbnlhbiUyMGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
        category: "Main Dishes",
        rating: 4.5,
        ordersThisWeek: 45,
      },
      {
        id: "githeri",
        name: "Githeri",
        description:
          "A simple and nutritious mix of boiled maize and beans, seasoned with spices. A Kenyan comfort food.",
        price: 400,
        image:
          "https://media.istockphoto.com/id/1367901029/photo/githeri-kenyan-traditional-food.jpg?b=1&s=170667a&w=0&k=20&c=vnJGCf9jexjJ-SqKz9-3oLj3J-7jxra-4M-tncIKU0U=",
        category: "Main Dishes",
        rating: 4.2,
        ordersThisWeek: 32,
      },
      {
        id: "sukuma-wiki",
        name: "Sukuma Wiki",
        description:
          "Collard greens cooked with onions, tomatoes, and spices. A common side dish in Kenyan cuisine.",
        price: 300,
        image:
          "https://www.africanbites.com/wp-content/uploads/2017/03/IMG_1793-2-1.jpg",
        category: "Sides & Extras",
        rating: 4.0,
        ordersThisWeek: 20,
      },
      {
        id: "kachumbari",
        name: "Kachumbari",
        description:
          "A fresh and zesty salad made with diced tomatoes, onions, and chili peppers. Perfect as a side or topping.",
        price: 250,
        image:
          "https://i0.wp.com/www.cheflolaskitchen.com/wp-content/uploads/2020/07/Kachumbari-4.jpg?resize=720%2C720&ssl=1",
        category: "Sides & Extras",
        rating: 4.3,
        ordersThisWeek: 28,
      },
    ],
  },
  {
    id: "nyama-choma-place",
    slug: "nyama-choma-place",
    name: "Nyama Choma Place",
    logo: "https://images.unsplash.com/photo-1606759553795-403def246338?w=200&h=200&fit=crop",
    tagline: "The Best Grilled Meat in Town",
    description:
      "We specialize in Nyama Choma, grilled meat cooked over an open flame. Our meat is sourced from local farms and seasoned with our secret blend of spices.",
    rating: 4.7,
    reviewCount: 189,
    distance: "500m",
    location: "Royal Suburbs Phase 1, Shop 5",
    deliveryTime: "10-15 min",
    deliveryFee: 75,
    isVerified: true,
    isLive: true,
    isOpen: false,
    openHours: "Tue-Sun, 12pm-10pm",
    categories: ["Food & Drinks", "Grilled Meat"],
    vendorCategories: [
      {
        id: "grilled-meat",
        slug: "grilled-meat",
        name: "Grilled Meat",
        description: "Selection of grilled meats",
        icon: UtensilsCrossed,
        productCount: 8,
        subcategories: [
          {
            id: "goat-meat",
            slug: "goat-meat",
            name: "Goat Meat",
            icon: Package,
            productCount: 3,
          },
          {
            id: "beef",
            slug: "beef",
            name: "Beef",
            icon: UtensilsCrossed,
            productCount: 5,
          },
        ],
      },
      {
        id: "sides",
        slug: "sides",
        name: "Sides & Extras",
        icon: Carrot,
        productCount: 5,
      },
      {
        id: "drinks",
        slug: "drinks",
        name: "Drinks",
        icon: Coffee,
        productCount: 6,
      },
    ],
    images: [
      "https://images.unsplash.com/photo-1606759553795-403def246338",
      "https://images.unsplash.com/photo-1555274175-9c79449dc48c",
      "https://images.unsplash.com/photo-1525610556331-2a99c89b4eae",
    ],
    certifications: ["Hygiene Certified", "Meat Safety Verified"],
    yearsInBusiness: 5,
    inEstate: true,
    menu: [
      {
        id: "nyama-choma-goat",
        name: "Nyama Choma (Goat)",
        description:
          "Grilled goat meat seasoned with our special blend of spices. Served with kachumbari and ugali.",
        price: 900,
        image:
          "https://media.istockphoto.com/id/1208214419/photo/roasted-mutton-meat-with-vegetables.jpg?s=612x612&w=0&k=20&c=dMG_4G-j8Gj6jG-w-9K9E-GqjQYl1wzJLwT4Mvy5w8E=",
        category: "Grilled Meat",
        rating: 4.9,
        ordersThisWeek: 89,
        isPopular: true,
      },
      {
        id: "nyama-choma-beef",
        name: "Nyama Choma (Beef)",
        description:
          "Grilled beef seasoned with our special blend of spices. Served with kachumbari and ugali.",
        price: 800,
        image:
          "https://media.istockphoto.com/id/182144519/photo/grilled-steak.jpg?s=612x612&w=0&k=20&c=QtgKezKUsXNrjZtZ-4J_EuJm9_1G-Jd4KiG9Jvv-jE4=",
        category: "Grilled Meat",
        rating: 4.6,
        ordersThisWeek: 56,
      },
      {
        id: "kuku-choma",
        name: "Kuku Choma",
        description:
          "Grilled chicken marinated in our special blend of spices. Served with kachumbari and ugali.",
        price: 700,
        image:
          "https://www.seriouseats.com/thmb/s-Dj-a-CjP-wb-eqJjVz_oYz-c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__recipes__images__2016__07__20160722-kenyan-chicken-kuku-choma-vicky-wasik-1-b4b3f5a9ca4c4891a7c99899e34076e1.jpg",
        category: "Grilled Meat",
        rating: 4.4,
        ordersThisWeek: 43,
      },
      {
        id: "ugali",
        name: "Ugali",
        description: "A Kenyan staple: maize flour cooked to a dough-like consistency.",
        price: 200,
        category: "Sides & Extras",
        rating: 4.0,
        ordersThisWeek: 30,
      },
      {
        id: "kachumbari",
        name: "Kachumbari",
        description:
          "A fresh and zesty salad made with diced tomatoes, onions, and chili peppers. Perfect as a side or topping.",
        price: 250,
        category: "Sides & Extras",
        rating: 4.3,
        ordersThisWeek: 28,
      },
      {
        id: "soda",
        name: "Soda",
        description: "Choose from a variety of sodas.",
        price: 100,
        category: "Drinks",
        rating: 4.5,
        ordersThisWeek: 35,
      },
    ],
  },
  {
    id: "fresh-juice-bar",
    slug: "fresh-juice-bar",
    name: "Fresh Juice Bar",
    logo: "https://images.unsplash.com/photo-1547496502-affa22d33ba1?w=200&h=200&fit=crop",
    tagline: "Healthy and Delicious Juices",
    description:
      "We offer a wide variety of fresh juices made with locally sourced fruits and vegetables. Our juices are healthy, delicious, and perfect for any occasion.",
    rating: 4.6,
    reviewCount: 156,
    distance: "750m",
    location: "Royal Suburbs Phase 3, Kiosk 2",
    deliveryTime: "15-20 min",
    deliveryFee: 60,
    isVerified: true,
    isLive: true,
    isOpen: true,
    openHours: "Mon-Sat, 8am-8pm",
    categories: ["Food & Drinks", "Juices & Smoothies"],
    vendorCategories: [
      {
        id: "fresh-juices",
        slug: "fresh-juices",
        name: "Fresh Juices",
        description: "Selection of fresh juices",
        icon: Apple,
        productCount: 10,
        subcategories: [
          {
            id: "fruit-juices",
            slug: "fruit-juices",
            name: "Fruit Juices",
            icon: Apple,
            productCount: 6,
          },
          {
            id: "vegetable-juices",
            slug: "vegetable-juices",
            name: "Vegetable Juices",
            icon: Leaf,
            productCount: 4,
          },
        ],
      },
      {
        id: "smoothies",
        slug: "smoothies",
        name: "Smoothies",
        description: "Selection of smoothies",
        icon: ShoppingBag,
        productCount: 7,
      },
    ],
    images: [
      "https://images.unsplash.com/photo-1547496502-affa22d33ba1",
      "https://images.unsplash.com/photo-1498550744921-75f79806ebf0",
      "https://images.unsplash.com/photo-1560781015-7bca3c7446ca",
    ],
    certifications: ["Hygiene Certified", "Fresh Produce Verified"],
    yearsInBusiness: 3,
    inEstate: true,
    menu: [
      {
        id: "mango-juice",
        name: "Mango Juice",
        description: "Freshly squeezed mango juice.",
        price: 350,
        image:
          "https://www.indianhealthyrecipes.com/wp-content/uploads/2023/03/mango-juice-recipe.jpg",
        category: "Fresh Juices",
        rating: 4.7,
        ordersThisWeek: 78,
        isPopular: true,
      },
      {
        id: "orange-juice",
        name: "Orange Juice",
        description: "Freshly squeezed orange juice.",
        price: 300,
        image:
          "https://www.allrecipes.com/thmb/EhnjGTWvQtK3jOTlzRjnGjz-YsI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/144440-homemade-orange-juice-DDM-4x3-1174-e1327a17b5034925b9a998c7c3b70c4e.jpg",
        category: "Fresh Juices",
        rating: 4.5,
        ordersThisWeek: 65,
      },
      {
        id: "watermelon-juice",
        name: "Watermelon Juice",
        description: "Freshly squeezed watermelon juice.",
        price: 250,
        image:
          "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/04/watermelon-juice-recipe.jpg",
        category: "Fresh Juices",
        rating: 4.3,
        ordersThisWeek: 52,
      },
      {
        id: "green-smoothie",
        name: "Green Smoothie",
        description:
          "A healthy smoothie made with spinach, kale, banana, and almond milk. Packed with vitamins and nutrients.",
        price: 400,
        category: "Smoothies",
        rating: 4.6,
        ordersThisWeek: 40,
      },
      {
        id: "berry-smoothie",
        name: "Berry Smoothie",
        description:
          "A delicious smoothie made with mixed berries, yogurt, and honey. Rich in antioxidants and flavor.",
        price: 450,
        category: "Smoothies",
        rating: 4.8,
        ordersThisWeek: 55,
      },
    ],
  },
];
