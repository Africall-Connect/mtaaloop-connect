

## Plan: Enhance Customer Service Visibility + Category-Unique Order Waiting Bay + AI-Generated Service Images

### 1. Create a Rich Services Showcase Section on Home Page
- Add a new **"Services at Your Fingertips"** section on `src/pages/Home.tsx` below products
- Display all service categories (Home Services, Beauty & Spa, Utilities, Quick Services) as visually rich cards with **hardcoded curated images** (high-quality Unsplash URLs) for each service type:
  - House Cleaning → cleaning image
  - Laundry → laundry image  
  - Hair Salon → salon image
  - Massage → massage image
  - Gas Delivery → gas cylinder image
  - Trash Collection → waste management image
  - Meal Prep → cooking image
  - etc.
- Each card is clickable, navigating to the relevant category/service page
- Wrap in `ScrollAnimatedGrid` for the unique scroll animations

### 2. Update Index.tsx (Marketplace) Services Section
- Replace the generic `Sparkles` icon placeholder in `BookingServiceCard` with curated service images mapped by category/name
- Create a new file `src/lib/serviceImages.ts` containing a mapping of service/category slugs to high-quality image URLs

### 3. Create `src/lib/serviceImages.ts`
- Map of category + subcategory names to curated Unsplash image URLs:
  - Beauty & Spa subcategories (Hair, Nails, Massage, Facial, Makeup, Bridal)
  - Home Services subcategories (Cleaning, Laundry, Electrical)
  - Utilities (Gas, Water)
  - Quick Services (Trash, Package, Dish washing, Cleaning, Laundry sorting, Meal prep, Errands)
  - Pharmacy, Accommodation, Food categories

### 4. Enhance QuickServices Page with Service Images
- Update `src/components/services/ServiceCard.tsx` to show a service image alongside the icon
- Add an image banner/thumbnail area using the `serviceImages` map

### 5. Category-Unique Order Waiting Bay
- Update `src/pages/OrderTracking.tsx` to have **unique, category-specific waiting messages and wording** beyond just icons:
  - **Food & Drinks / Restaurant**: "Your chef is crafting something delicious... Sit back and let the aroma come to you"
  - **Home Services / Cleaning**: "Your space is about to sparkle... Our cleaning pro is gearing up"
  - **Beauty & Spa**: "Glamour is on its way... Your beauty specialist is preparing your session"
  - **Pharmacy**: "Your health matters... Our pharmacist is carefully preparing your medication"
  - **Groceries**: "Fresh picks coming your way... We're selecting the best items for you"
  - **Liquor Store**: "Fine selection incoming... Your drinks are being carefully packaged"
  - **Utilities & Services**: "Your service is being arranged... A specialist is being assigned"
  - **Accommodation**: "Your cozy stay is being prepared... Fresh linens and all"
- Add unique **waiting tips** per category (e.g., "While you wait, why not set the table?" for food)
- Add category-specific **animated illustrations** using curated images in the waiting card

### 6. Files to Create/Edit
- **Create**: `src/lib/serviceImages.ts` — centralized service image URL mapping
- **Edit**: `src/pages/Home.tsx` — add services showcase section with images
- **Edit**: `src/pages/Index.tsx` — update BookingServiceCard to use images
- **Edit**: `src/components/services/ServiceCard.tsx` — add image thumbnail
- **Edit**: `src/pages/QuickServices.tsx` — add visual hero images per service
- **Edit**: `src/pages/OrderTracking.tsx` — unique category-specific waiting bay copy, tips, and images

