

# Home Page Redesign Plan

## Overview

This plan redesigns the Home.tsx page to:
1. Remove the "5 minute delivery", "Hyperlocal", and "Building Vendors" feature cards at the bottom
2. Reduce the header height (currently uses h-20 for logo which is too tall)
3. Update the "What are you looking for?" section to use only the 10 official categories
4. Rename "Popular Vendors Near You" to "MtaaLoop Minimart" (since it's your own store)
5. Improve mobile responsiveness for PWA compatibility

---

## Part 1: Remove Bottom Feature Cards

### Current State (Lines 2265-2285)
The page has 3 cards at the bottom:
- "5-15 Min Delivery"
- "Building Vendors"
- "Hyperlocal"

### Action
**DELETE** the entire "Quick Access Features" section (lines 2264-2285).

---

## Part 2: Reduce Header Height

### Current State (Lines 546-613)
The header uses:
- Logo: `h-20 w-20` (80px x 80px) - too large
- Text: `text-2xl` - appropriate
- Padding: `py-4` - reasonable

### Changes
- Reduce logo from `h-20 w-20` to `h-10 w-10` (40px)
- Adjust padding to `py-3` for a more compact header
- Make location info more compact on mobile

### New Header Structure

```text
+--------------------------------------------------+
| [Logo 40px] Mtaaloop       [Connect] [Cart] [User]|
|             📍 Location - Change                  |
+--------------------------------------------------+
```

---

## Part 3: Update Categories to Official 10

### Current State (Lines 293-541)
The page has **30+ categories** including many that don't exist in the official category system:
- Auto Services ❌
- Repairs & Maintenance ❌
- Fashion & Clothing ❌
- Electronics & Gadgets ❌
- Fitness & Sports ❌
- Education & Tutoring ❌
- Event & Entertainment ❌
- Professional Services ❌
- Pet Services ❌
- Home & Garden ❌
- Books & Stationery ❌
- Baby & Kids ❌
- Transport & Logistics ❌
- Security Services ❌
- Religious Services ❌
- Creative Services ❌
- Construction Services ❌
- Agriculture & Farming ❌
- Trash Collection ❌ (keep as special service)
- Wedding Services ❌
- Special Occasions ❌

### Official Categories (10 total)
| Category | Icon | Subtitle | Link | Gradient |
|----------|------|----------|------|----------|
| Food & Drinks | UtensilsCrossed | Fast Food, Traditional & More | /food-drinks | from-orange-500 to-red-500 |
| Living Essentials | Package | Toiletries, Cleaning & Household | /living-essentials | from-cyan-500 to-blue-500 |
| Groceries & Food | ShoppingBag | Fresh Produce, Meat & Dairy | /groceries-food | from-green-500 to-emerald-500 |
| Restaurant | UtensilsCrossed | Dine-in & Custom Menus | /restaurant | from-amber-500 to-orange-500 |
| Liquor Store | Wine | Beer, Wine, Spirits & More | /liquor-store | from-red-600 to-rose-500 |
| Utilities & Services | Droplet | Gas & Water Delivery | /utilities-services | from-blue-600 to-sky-500 |
| Home Services | HomeIcon | Cleaning, Laundry & Electrical | /home-services | from-teal-500 to-green-500 |
| Beauty & Spa | Sparkles | Hair, Nails, Massage & More | /beauty-spa | from-pink-500 to-purple-500 |
| Accommodation | Hotel | Guest Houses, Airbnb & Rentals | /accommodation | from-indigo-500 to-violet-500 |
| Pharmacy | Pill | Medicines, Consultations & Care | /pharmacy | from-sky-500 to-cyan-400 |

### Special Service (Keep)
- **Trash Collection** - keep as a special utility service that's always available

---

## Part 4: Rename "Popular Vendors Near You" to MtaaLoop Minimart Section

### Current State (Lines 855-870)
Section titled "Popular Vendors Near You" but contains MtaaLoop-owned stores.

### Changes
- Rename section to "MtaaLoop Essentials" or "Our Shops" 
- Keep the MtaaLoop Mart card as the primary focus
- Remove the massive list of 40+ "MtaaLoop X" stores (lines 873-2131) - this is excessive and clutters the page
- Show only 3-4 key MtaaLoop services

---

## Part 5: Mobile Responsiveness Improvements

### Issues to Fix
1. **Header**: Too tall on mobile, buttons cramped
2. **Search**: Works well, keep as-is
3. **Categories Grid**: 1 column on mobile is good, but cards are too tall
4. **Welcome Section**: Text too large on mobile

### Mobile-First Improvements

| Element | Current | New Mobile |
|---------|---------|------------|
| Header Logo | h-20 w-20 | h-8 w-8 (mobile), h-10 w-10 (desktop) |
| Header Padding | py-4 | py-2 (mobile), py-3 (desktop) |
| Welcome H1 | text-3xl md:text-4xl | text-xl md:text-3xl |
| Category Cards | h-40 | h-32 (mobile), h-40 (desktop) |
| Category Grid | 1/2/3 cols | Horizontal scroll on mobile |
| MtaaLoop Section | Vertical grid | Horizontal scroll on mobile |

---

## Implementation Details

### File: `src/pages/Home.tsx`

#### 1. Update Categories Array (Replace lines 293-541)

```typescript
const categories = [
  {
    icon: UtensilsCrossed,
    name: "Food & Drinks",
    subtitle: "Fast Food, Traditional, Cafes & More",
    link: "/food-drinks",
    gradient: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80"
  },
  {
    icon: Package,
    name: "Living Essentials",
    subtitle: "Toiletries, Cleaning & Household",
    link: "/living-essentials",
    gradient: "from-cyan-500 to-blue-500",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80"
  },
  {
    icon: ShoppingBag,
    name: "Groceries & Food",
    subtitle: "Fresh Produce, Meat, Dairy & Snacks",
    link: "/groceries-food",
    gradient: "from-green-500 to-emerald-500",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80"
  },
  {
    icon: UtensilsCrossed,
    name: "Restaurant",
    subtitle: "Dine-in Experience & Custom Menus",
    link: "/restaurant",
    gradient: "from-amber-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80"
  },
  {
    icon: Wine,
    name: "Liquor Store",
    subtitle: "Beer, Wine, Spirits & Beverages",
    link: "/liquor-store",
    gradient: "from-red-600 to-rose-500",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&q=80"
  },
  {
    icon: Droplet,
    name: "Utilities & Services",
    subtitle: "Gas & Water Delivery",
    link: "/utilities-services",
    gradient: "from-blue-600 to-sky-500",
    image: "https://images.unsplash.com/photo-1585687433448-e0d7cba3c0a5?w=500&q=80"
  },
  {
    icon: HomeIcon,
    name: "Home Services",
    subtitle: "Cleaning, Laundry & Electrical",
    link: "/home-services",
    gradient: "from-teal-500 to-green-500",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80"
  },
  {
    icon: Sparkles,
    name: "Beauty & Spa",
    subtitle: "Hair, Nails, Massage & Makeup",
    link: "/beauty-spa",
    gradient: "from-pink-500 to-purple-500",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80"
  },
  {
    icon: Hotel,
    name: "Accommodation",
    subtitle: "Guest Houses, Airbnb & Rentals",
    link: "/accommodation",
    gradient: "from-indigo-500 to-violet-500",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80"
  },
  {
    icon: Pill,
    name: "Pharmacy",
    subtitle: "Medicines, Consultations & Care",
    link: "/pharmacy",
    gradient: "from-sky-500 to-cyan-400",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&q=80"
  },
  // Special Service - Keep Trash Collection
  {
    icon: Trash2,
    name: "Trash Collection",
    subtitle: "Quick doorstep pickup - KSh 30",
    link: "/trash-collection",
    gradient: "from-emerald-600 to-teal-700",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80"
  },
];
```

#### 2. Update Header (Lines 547-613)

```tsx
<header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
  <div className="container px-4 py-2 md:py-3">
    <div className="flex items-center justify-between">
      {/* Logo & Location */}
      <div className="flex items-center gap-2 md:gap-3">
        <img 
          src="/logo.png" 
          alt="Mtaaloop Logo" 
          className="h-8 w-8 md:h-10 md:w-10 object-contain" 
        />
        <div>
          <span className="text-lg md:text-xl font-bold text-primary">Mtaaloop</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 hidden sm:block" />
            <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
              {currentApartment?.name || "Select Location"}
            </span>
            <button onClick={() => setApartmentModalOpen(true)} className="text-primary hover:underline ml-1">
              Change
            </button>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Hide Connect on mobile to save space */}
        <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2" onClick={() => navigate('/mtaaloop')}>
          <Users className="h-4 w-4" />
          <span>Connect</span>
        </Button>
        <Link to="/cart">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getItemCount()}
            </span>
          </Button>
        </Link>
        <Link to="/account">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
          </Button>
        </Link>
      </div>
    </div>
  </div>
</header>
```

#### 3. Update Welcome Section (Lines 616-624)

```tsx
<div className="mb-6">
  <h1 className="text-xl md:text-3xl font-bold mb-1">
    Welcome to Mtaaloop
  </h1>
  <p className="text-muted-foreground text-sm md:text-base">
    Everything you need, delivered to your doorstep
  </p>
</div>
```

#### 4. Simplify MtaaLoop Section (Replace lines 855-2131)

Rename from "Popular Vendors Near You" to "MtaaLoop Essentials" and show only 3-4 key stores:

```tsx
{/* MtaaLoop Essentials Section */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-xl md:text-2xl font-bold">MtaaLoop Essentials</h2>
      <p className="text-sm text-muted-foreground">
        Our shops, always available for you
      </p>
    </div>
  </div>
  
  {/* Horizontal scrollable on mobile */}
  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
    {/* MtaaLoop Mart */}
    <Card className="min-w-[280px] md:min-w-0 snap-start group overflow-hidden cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/mtaaloop-mart')}>
      <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="w-full h-full flex items-center justify-center text-5xl">🛒</div>
        <Badge className="absolute top-3 right-3 bg-green-600">🟢 Open</Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg group-hover:text-primary">MtaaLoop Mart</h3>
        <p className="text-sm text-muted-foreground">Your one-stop shop for essentials</p>
      </div>
    </Card>
    
    {/* MtaaLoop Pharmacy */}
    <Card className="min-w-[280px] md:min-w-0 snap-start group overflow-hidden cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/mtaaloop-pharmacy')}>
      <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-cyan-500/20 to-sky-500/5">
        <div className="w-full h-full flex items-center justify-center text-5xl">💊</div>
        <Badge className="absolute top-3 right-3 bg-green-600">🟢 Open</Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg group-hover:text-primary">MtaaLoop Pharmacy</h3>
        <p className="text-sm text-muted-foreground">Medicine & health consultations</p>
      </div>
    </Card>
    
    {/* MtaaLoop Gas */}
    <Card className="min-w-[280px] md:min-w-0 snap-start group overflow-hidden cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/mtaaloop-gas')}>
      <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-orange-500/20 to-amber-500/5">
        <div className="w-full h-full flex items-center justify-center text-5xl">🔥</div>
        <Badge className="absolute top-3 right-3 bg-green-600">🟢 Open</Badge>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg group-hover:text-primary">MtaaLoop Gas</h3>
        <p className="text-sm text-muted-foreground">LPG refills & cooking gas</p>
      </div>
    </Card>
  </div>
</div>
```

#### 5. Delete Quick Access Features (Lines 2264-2285)

Remove the entire section with "5-15 Min Delivery", "Building Vendors", and "Hyperlocal" cards.

#### 6. Mobile-Optimized Category Grid

```tsx
{/* Categories */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl md:text-2xl font-bold">What are you looking for?</h2>
  </div>
  
  {/* Mobile: 2 columns, Desktop: 3 columns */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
    {categories.map((category) => (
      <Link key={category.name} to={category.link}>
        <Card className="group relative overflow-hidden h-28 md:h-40 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 border-2 hover:border-primary/50">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundImage: `url(${category.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          
          {/* Content */}
          <div className="relative p-3 md:p-4 h-full flex flex-col justify-end">
            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg bg-white/20 backdrop-blur-sm p-1.5 md:p-2 mb-2`}>
              <category.icon className="w-full h-full text-white" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-white line-clamp-1">
              {category.name}
            </h3>
            <p className="text-xs text-white/80 line-clamp-1 hidden md:block">
              {category.subtitle}
            </p>
          </div>
        </Card>
      </Link>
    ))}
  </div>
</div>
```

---

## Summary of Changes

| Section | Action | Impact |
|---------|--------|--------|
| **Header** | Reduce logo to h-8/h-10, compact padding | 50% height reduction |
| **Welcome** | Smaller text on mobile | Better mobile fit |
| **Categories** | Replace 30+ with 11 official categories | Clean, accurate taxonomy |
| **Category Grid** | 2 cols mobile, 3 cols desktop, shorter cards | Mobile optimized |
| **MtaaLoop Section** | Rename to "MtaaLoop Essentials", keep 3-4 stores | Focused, not cluttered |
| **Feature Cards** | DELETE "5-15 Min Delivery", "Hyperlocal", "Building Vendors" | Cleaner bottom |
| **Minimarts Section** | Keep as-is (lines 806-853) | Shows nearby minimarts |

---

## Technical Notes

1. **Import Updates**: Remove unused icons, add `Package` for Living Essentials
2. **File Size**: Reduces from ~2300 lines to ~800 lines (remove 40+ hardcoded MtaaLoop cards)
3. **Mobile First**: All breakpoints use `md:` prefix for desktop enhancements
4. **PWA Ready**: Compact header, touch-friendly cards, horizontal scroll for mobile

