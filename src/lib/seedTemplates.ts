/**
 * Curated product templates for the SeedVendorProducts admin tool.
 *
 * Each template is a list of products with proper category-appropriate
 * Unsplash image URLs. Selecting a template populates the seeder form so
 * admin can review/edit before bulk-inserting.
 */

export interface SeedProduct {
  name: string;
  subcategory: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
}

export const SEED_TEMPLATES: Record<string, { businessType: string; products: SeedProduct[] }> = {
  // ──────────────────────────────────────────────────────────────────────
  // BUTCHERY
  // ──────────────────────────────────────────────────────────────────────
  Butchery: {
    businessType: "Butchery",
    products: [
      // Goat & Mutton
      { name: "Goat Leg (1 kg)", subcategory: "Goat & Mutton", price: 850, stock: 25, description: "Fresh goat hind leg, perfect for nyama choma or stew.", image_url: "https://images.unsplash.com/photo-1602476572867-1f200b630884?w=400&h=400&fit=crop" },
      { name: "Mutton Chops (500 g)", subcategory: "Goat & Mutton", price: 520, stock: 30, description: "Tender mutton chops, ideal for grilling.", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
      { name: "Goat Ribs (1 kg)", subcategory: "Goat & Mutton", price: 780, stock: 20, description: "Goat rib cuts, great for slow roasting.", image_url: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=400&h=400&fit=crop" },
      { name: "Goat Stew Cut (1 kg)", subcategory: "Goat & Mutton", price: 700, stock: 35, description: "Mixed goat cuts for traditional stews.", image_url: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=400&fit=crop" },

      // Beef
      { name: "Beef Steak (500 g)", subcategory: "Beef", price: 600, stock: 40, description: "Tender beef steak cuts ready for the pan.", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
      { name: "Beef Leg (1 kg)", subcategory: "Beef", price: 800, stock: 25, description: "Fresh beef leg, suitable for roasts and stews.", image_url: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&h=400&fit=crop" },
      { name: "T-Bone Steak (500 g)", subcategory: "Beef", price: 950, stock: 20, description: "Premium T-bone cut for grilling.", image_url: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop" },
      { name: "Beef Ribs (1 kg)", subcategory: "Beef", price: 720, stock: 25, description: "Meaty beef ribs ideal for BBQ.", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop" },

      // Pork
      { name: "Pork Chops (500 g)", subcategory: "Pork", price: 550, stock: 30, description: "Bone-in pork chops, juicy and tender.", image_url: "https://images.unsplash.com/photo-1602470521006-13cb3da3a2ae?w=400&h=400&fit=crop" },
      { name: "Pork Belly (1 kg)", subcategory: "Pork", price: 850, stock: 20, description: "Pork belly with the perfect fat-to-meat ratio.", image_url: "https://images.unsplash.com/photo-1516824501780-3aff8abdc865?w=400&h=400&fit=crop" },
      { name: "Pork Ribs (1 kg)", subcategory: "Pork", price: 780, stock: 22, description: "Meaty pork ribs for BBQ and roasting.", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop" },

      // Chicken (Broiler)
      { name: "Whole Chicken (1.5 kg)", subcategory: "Chicken (Broiler)", price: 650, stock: 50, description: "Fresh whole broiler chicken, dressed and ready.", image_url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop" },
      { name: "Chicken Breast (500 g)", subcategory: "Chicken (Broiler)", price: 450, stock: 60, description: "Boneless skinless chicken breast.", image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop" },
      { name: "Chicken Drumsticks (500 g)", subcategory: "Chicken (Broiler)", price: 380, stock: 55, description: "Juicy chicken drumsticks.", image_url: "https://images.unsplash.com/photo-1610614819513-58e34989848b?w=400&h=400&fit=crop" },
      { name: "Chicken Wings (500 g)", subcategory: "Chicken (Broiler)", price: 350, stock: 60, description: "Chicken wings perfect for frying or grilling.", image_url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=400&fit=crop" },
      { name: "Chicken Thighs (500 g)", subcategory: "Chicken (Broiler)", price: 400, stock: 50, description: "Bone-in chicken thighs.", image_url: "https://images.unsplash.com/photo-1604908554007-fb8f54142fce?w=400&h=400&fit=crop" },

      // Minced Meat
      { name: "Beef Mince (500 g)", subcategory: "Minced Meat", price: 400, stock: 45, description: "Freshly ground beef mince.", image_url: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop" },
      { name: "Goat Mince (500 g)", subcategory: "Minced Meat", price: 480, stock: 30, description: "Ground goat meat for keema and meatballs.", image_url: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop" },
      { name: "Pork Mince (500 g)", subcategory: "Minced Meat", price: 420, stock: 25, description: "Ground pork for sausages and dumplings.", image_url: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop" },
      { name: "Chicken Mince (500 g)", subcategory: "Minced Meat", price: 360, stock: 35, description: "Ground chicken for healthy meals.", image_url: "https://images.unsplash.com/photo-1603048719539-9ecb4aa395e3?w=400&h=400&fit=crop" },

      // Offal & Specialty
      { name: "Beef Liver (500 g)", subcategory: "Offal & Specialty", price: 280, stock: 40, description: "Fresh beef liver, rich in iron.", image_url: "https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop" },
      { name: "Goat Heart (250 g)", subcategory: "Offal & Specialty", price: 220, stock: 30, description: "Tender goat heart cuts.", image_url: "https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop" },
      { name: "Beef Tripe (500 g)", subcategory: "Offal & Specialty", price: 320, stock: 35, description: "Cleaned beef tripe ready for cooking.", image_url: "https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop" },
      { name: "Beef Kidney (500 g)", subcategory: "Offal & Specialty", price: 280, stock: 25, description: "Fresh beef kidney.", image_url: "https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop" },
      { name: "Chicken Gizzard (500 g)", subcategory: "Offal & Specialty", price: 260, stock: 45, description: "Chicken gizzards, perfect for stews.", image_url: "https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop" },
      { name: "Beef Tongue (1 piece)", subcategory: "Offal & Specialty", price: 650, stock: 15, description: "Whole beef tongue, a traditional delicacy.", image_url: "https://images.unsplash.com/photo-1542901031-ec5eeb518e3a?w=400&h=400&fit=crop" },

      // Soup Bones
      { name: "Beef Soup Bones (1 kg)", subcategory: "Soup Bones", price: 250, stock: 60, description: "Beef bones for rich, hearty soups.", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
      { name: "Goat Soup Bones (1 kg)", subcategory: "Soup Bones", price: 280, stock: 50, description: "Goat soup bones, packed with flavour.", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
      { name: "Mutton Bones (1 kg)", subcategory: "Soup Bones", price: 260, stock: 40, description: "Mutton bones for stocks and broths.", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },
      { name: "Marrow Bones (1 kg)", subcategory: "Soup Bones", price: 350, stock: 35, description: "Beef marrow bones for bone broth.", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=400&fit=crop" },

      // Sausages & Smoked
      { name: "Beef Sausages (500 g)", subcategory: "Sausages & Smoked", price: 480, stock: 50, description: "Premium beef sausages.", image_url: "https://images.unsplash.com/photo-1601924357840-3e50e6c52a88?w=400&h=400&fit=crop" },
      { name: "Pork Sausages (500 g)", subcategory: "Sausages & Smoked", price: 520, stock: 40, description: "Fresh pork sausages for the grill.", image_url: "https://images.unsplash.com/photo-1601924357840-3e50e6c52a88?w=400&h=400&fit=crop" },
      { name: "Smoked Pork Ribs (1 kg)", subcategory: "Sausages & Smoked", price: 950, stock: 20, description: "Slow-smoked pork ribs.", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop" },
      { name: "Hot Dogs (Pack of 8)", subcategory: "Sausages & Smoked", price: 380, stock: 60, description: "Classic hot dog sausages.", image_url: "https://images.unsplash.com/photo-1612392062798-2c4d44f4fce7?w=400&h=400&fit=crop" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // MOBILE ACCESSORIES
  // ──────────────────────────────────────────────────────────────────────
  "Mobile Accessories": {
    businessType: "Mobile Accessories",
    products: [
      // Phone Cases
      { name: "Silicone Case — iPhone 15", subcategory: "Phone Cases", price: 850, stock: 40, description: "Soft-touch silicone protective case.", image_url: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop" },
      { name: "Clear Case — Samsung S24", subcategory: "Phone Cases", price: 650, stock: 50, description: "Crystal-clear flexible TPU case.", image_url: "https://images.unsplash.com/photo-1574535082925-9aa1bcd6f0b1?w=400&h=400&fit=crop" },
      { name: "Wallet Case — iPhone 13", subcategory: "Phone Cases", price: 1250, stock: 25, description: "Leather flip wallet case with card slots.", image_url: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop" },

      // Screen Protectors
      { name: "Tempered Glass — iPhone 15", subcategory: "Screen Protectors", price: 450, stock: 80, description: "9H hardness tempered glass screen protector.", image_url: "https://images.unsplash.com/photo-1604054094723-3a949e4fca0b?w=400&h=400&fit=crop" },
      { name: "Tempered Glass — Samsung S24", subcategory: "Screen Protectors", price: 450, stock: 80, description: "Edge-to-edge tempered glass.", image_url: "https://images.unsplash.com/photo-1604054094723-3a949e4fca0b?w=400&h=400&fit=crop" },
      { name: "Privacy Screen — Universal", subcategory: "Screen Protectors", price: 650, stock: 40, description: "Anti-spy privacy tempered glass.", image_url: "https://images.unsplash.com/photo-1604054094723-3a949e4fca0b?w=400&h=400&fit=crop" },

      // Chargers & Cables
      { name: "USB-C to USB-C Cable 2m", subcategory: "Chargers & Cables", price: 550, stock: 100, description: "Fast-charge braided USB-C cable.", image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop" },
      { name: "Lightning Cable 1m", subcategory: "Chargers & Cables", price: 480, stock: 90, description: "MFi-compatible Lightning cable for iPhone.", image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop" },
      { name: "20W USB-C Charger", subcategory: "Chargers & Cables", price: 950, stock: 60, description: "Fast PD wall charger.", image_url: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&h=400&fit=crop" },
      { name: "65W GaN Charger", subcategory: "Chargers & Cables", price: 2200, stock: 30, description: "Multi-port GaN fast charger.", image_url: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&h=400&fit=crop" },

      // Power Banks
      { name: "10000mAh Power Bank", subcategory: "Power Banks", price: 1850, stock: 50, description: "Slim power bank with USB-C input.", image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
      { name: "20000mAh Power Bank", subcategory: "Power Banks", price: 2850, stock: 35, description: "High-capacity power bank with three ports.", image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
      { name: "Solar Power Bank 30000mAh", subcategory: "Power Banks", price: 3500, stock: 20, description: "Solar-charging rugged power bank.", image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },

      // Headphones & Earbuds
      { name: "Wired Earbuds 3.5mm", subcategory: "Headphones & Earbuds", price: 350, stock: 100, description: "In-ear wired earbuds with mic.", image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop" },
      { name: "Wireless Earbuds Pro", subcategory: "Headphones & Earbuds", price: 2850, stock: 40, description: "Bluetooth 5.3 earbuds with charging case.", image_url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop" },
      { name: "Over-Ear Headphones", subcategory: "Headphones & Earbuds", price: 3500, stock: 25, description: "Comfortable over-ear wireless headphones.", image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop" },

      // Bluetooth Speakers
      { name: "Mini BT Speaker", subcategory: "Bluetooth Speakers", price: 1250, stock: 50, description: "Portable mini Bluetooth speaker.", image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop" },
      { name: "Waterproof BT Speaker", subcategory: "Bluetooth Speakers", price: 2850, stock: 30, description: "IPX7 rated outdoor speaker.", image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop" },

      // Memory Cards
      { name: "MicroSD 64GB", subcategory: "Memory Cards", price: 850, stock: 60, description: "Class 10 high-speed MicroSD.", image_url: "https://images.unsplash.com/photo-1620828107226-2a1b6c5f4cc7?w=400&h=400&fit=crop" },
      { name: "MicroSD 128GB", subcategory: "Memory Cards", price: 1450, stock: 50, description: "U3 V30 MicroSD for 4K video.", image_url: "https://images.unsplash.com/photo-1620828107226-2a1b6c5f4cc7?w=400&h=400&fit=crop" },

      // Phone Holders & Mounts
      { name: "Car Phone Mount", subcategory: "Phone Holders & Mounts", price: 750, stock: 50, description: "Magnetic dashboard phone mount.", image_url: "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=400&h=400&fit=crop" },
      { name: "Desk Phone Stand", subcategory: "Phone Holders & Mounts", price: 480, stock: 70, description: "Adjustable aluminium desk stand.", image_url: "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=400&h=400&fit=crop" },

      // Replacement Batteries
      { name: "iPhone 11 Battery", subcategory: "Replacement Batteries", price: 1850, stock: 25, description: "OEM-grade replacement battery.", image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
      { name: "Samsung S20 Battery", subcategory: "Replacement Batteries", price: 1950, stock: 20, description: "Replacement battery with installation kit.", image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // FLOWERS & GIFTS
  // ──────────────────────────────────────────────────────────────────────
  "Flowers & Gifts": {
    businessType: "Flowers & Gifts",
    products: [
      { name: "Red Rose Bouquet (12 stems)", subcategory: "Bouquets", price: 1850, stock: 30, description: "Classic dozen red rose bouquet.", image_url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop" },
      { name: "Mixed Spring Bouquet", subcategory: "Bouquets", price: 1450, stock: 40, description: "Cheerful mixed spring flowers.", image_url: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop" },
      { name: "Sunflower Bunch", subcategory: "Fresh Flowers", price: 850, stock: 50, description: "Fresh sunflower stems.", image_url: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop" },
      { name: "White Lilies", subcategory: "Fresh Flowers", price: 1250, stock: 30, description: "Elegant white lilies.", image_url: "https://images.unsplash.com/photo-1565011523534-747a8601f10a?w=400&h=400&fit=crop" },
      { name: "Indoor Snake Plant", subcategory: "Indoor Plants", price: 1850, stock: 25, description: "Low-maintenance snake plant in ceramic pot.", image_url: "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=400&fit=crop" },
      { name: "Monstera Deliciosa", subcategory: "Indoor Plants", price: 2850, stock: 15, description: "Statement Monstera in 8\" pot.", image_url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop" },
      { name: "Gourmet Gift Hamper", subcategory: "Gift Baskets & Hampers", price: 4500, stock: 20, description: "Wine, cheese, and chocolate gift hamper.", image_url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop" },
      { name: "Birthday Hamper", subcategory: "Gift Baskets & Hampers", price: 3200, stock: 25, description: "Cake, flowers and chocolates birthday hamper.", image_url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // GENERIC GROCERIES (placeholder for groceries vendors)
  // ──────────────────────────────────────────────────────────────────────
  "Generic Groceries": {
    businessType: "Groceries & Food",
    products: [
      { name: "Tomatoes (1 kg)", subcategory: "Vegetables", price: 120, stock: 80, description: "Fresh red tomatoes.", image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=400&fit=crop" },
      { name: "Onions (1 kg)", subcategory: "Vegetables", price: 100, stock: 100, description: "Fresh red onions.", image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=400&fit=crop" },
      { name: "Bananas (1 kg)", subcategory: "Fruits", price: 90, stock: 70, description: "Ripe sweet bananas.", image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop" },
      { name: "Apples (1 kg)", subcategory: "Fruits", price: 220, stock: 60, description: "Crisp red apples.", image_url: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop" },
      { name: "Whole Milk (1 L)", subcategory: "Dairy & Eggs", price: 80, stock: 100, description: "Fresh whole cow's milk.", image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop" },
      { name: "Eggs (Tray of 30)", subcategory: "Dairy & Eggs", price: 480, stock: 50, description: "Farm-fresh eggs.", image_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop" },
      { name: "White Bread Loaf", subcategory: "Bread & Bakery", price: 60, stock: 80, description: "Fresh sliced white bread.", image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop" },
      { name: "Brown Bread Loaf", subcategory: "Bread & Bakery", price: 75, stock: 60, description: "Whole-wheat brown bread.", image_url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=400&fit=crop" },
    ],
  },
};

export type SeedTemplateName = keyof typeof SEED_TEMPLATES;
