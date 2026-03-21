# MtaaLoop — Complete Platform Documentation

**Kenya's Hyperlocal Marketplace**
**Confidential | March 2026 Edition**
**Prepared by: James Melwish (Melwish) — Director, Africall Solutions Ltd | Co-Founder, MtaaLoop**

---

## Table of Contents

1. [What is MtaaLoop?](#1-what-is-mtaaloop)
2. [Platform Features & Pages](#2-platform-features--pages)
3. [User Roles & Access](#3-user-roles--access)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Schema](#5-database-schema)
6. [Route Map](#6-route-map)
7. [Order Flow & Fulfillment](#7-order-flow--fulfillment)
8. [MtaaLoop Mart (Minimart)](#8-mtaaloop-mart-minimart)
9. [Vendor System](#9-vendor-system)
10. [Rider & Delivery System](#10-rider--delivery-system)
11. [Estate Management](#11-estate-management)
12. [Booking & Consultation System](#12-booking--consultation-system)
13. [Subscription & Gamification](#13-subscription--gamification)
14. [Integrations & Third-Party Services](#14-integrations--third-party-services)
15. [Partner Program](#15-partner-program)
16. [Current Status & Roadmap](#16-current-status--roadmap)
17. [Contact](#17-contact)

---

## 1. What is MtaaLoop?

**MtaaLoop is a hyperlocal digital marketplace that connects people in the same neighborhood to buy, sell, hire, and interact — all from their phones.**

The word *Mtaa* is Swahili for *neighborhood* or *local area*. *Loop* means everyone in your area is connected in one loop — a digital community. Together, **MtaaLoop** means: *your neighborhood, fully connected.*

Launched in **January 2026**, MtaaLoop is building the infrastructure to make every neighborhood in Kenya a thriving digital economy — starting with Nairobi.

### The Problem It Solves

Kenyans currently:
- Buy groceries from nearby dukas or supermarkets
- Know a fundi (technician/artisan) nearby
- Need plumbers, electricians, or couriers urgently
- Sell second-hand items through trust networks
- Want to know about local events

All of this happens through random WhatsApp groups, word-of-mouth, or physically walking around. **MtaaLoop is the organized, digital platform built specifically for your neighborhood.**

---

## 2. Platform Features & Pages

### 2.1 Home / Feed (`/home`)
The main landing page after login. Shows a neighborhood activity feed — nearby listings, new shops, announcements, trending products, and community posts. Think of it like a neighborhood version of Facebook's newsfeed focused on what's around you.

### 2.2 MtaaLoop Mart (`/mtaaloop-mart`)
Built-in online supermarket with **500+ products across 25 categories** — from Cooking Oils, Bread & Bakery, Snacks, Household Cleaning, Personal Care, Vegetables, Meat, Frozen Foods, and more.

**How it works for customers:**
- Browse or search by category
- Add items to cart, place an order
- Local delivery rider brings the order to their doorstep

**How it works for sellers/partners:**
- Products listed on the Mart via admin panel
- Orders come through the platform
- Fulfilled by MtaaLoop's own team (dedicated vendor account: `mtaaloop@africall.ke`)

### 2.3 Marketplace (`/marketplace`)
Residents list items to sell — furniture, electronics, clothes, appliances. Buyers in the same area can purchase. This is the Craigslist/Facebook Marketplace equivalent, but hyperlocal and Kenya-specific.

### 2.4 Services Directory
Local service providers list their skills. A plumber in Westlands, an electrician in Kasarani, a tailor in Umoja — they create a profile and residents can find and hire them directly.

**Service categories include:**
- Food & Drinks (Quick Bites, Fast Food, Traditional Kenyan Food, Butchery, Beverages)
- Shopping & Fashion
- Health & Wellness (Pharmacy with consultation booking)
- Beauty & Spa (Hair, Nails, Massage, Makeup)
- Home Services (Cleaning, Laundry, Carpet Cleaning, Airbnb Cleaning)
- Repairs (Phone/Computer, Appliance, Plumbing, Electrical)
- Transport (Car Wash, Car Hire)
- Essentials (Water Refills, Gas Refills, Borehole Water)
- Special Occasions (Gift Baskets, Event Planning, Cakes, Party Supplies, Photography)
- Liquor & Wines
- Khat
- Accommodation & Airbnb Listings
- Baby & Kids
- Logistics
- Flowers & Gifts
- Utilities, Security, Religious Services
- Creative Services, Construction, Agriculture, Wedding

### 2.5 Quick Services (`/quick-services`)
On-demand neighborhood services:
- **Osha Viombo** — Quick dish washing
- **Quick Cleaning** — Express home cleaning
- **Laundry Sorting** — Laundry pickup & sorting
- **Quick Meal Prep** — Express meal preparation
- **Package Collection** — Parcel pickup service
- **Errands** — Run errands on your behalf
- **Trash Collection** — Waste management with tracking

### 2.6 MtaaLoop Plus (`/mtaaloop-plus`)
Premium subscription tier offering enhanced features and benefits.

### 2.7 Booking System (`/my-bookings`)
Service providers can offer bookable time slots. Customers can schedule appointments for services like beauty, repairs, consultations, etc.

### 2.8 Pharmacy Consultations (`/my-consultations`)
Pharmacies can offer online consultations with pre-consultation forms. Customers fill in symptoms, medical history, and book a time slot with a pharmacist.

### 2.9 Neighbor Connect / Inbox (`/inbox`)
Messaging feature for community communication. Real-time chat between users, vendors, and support.

### 2.10 Events & Announcements
Community events, church services, estate meetings, local promotions — all posted and visible to neighborhood residents.

### 2.11 Admin Panel (`/admin/dashboard`)
Backend control center for MtaaLoop administrators:
- User management
- Vendor approvals & management
- Estate approvals & management
- Rider approvals
- MtaaLoop Mart product management
- Vendor payouts
- Live chat assignment
- Compliance dashboard
- Onboarding tools
- Seed data tools

### 2.12 Vendor Portal (`/vendor/dashboard`)
Full-featured dashboard for vendors:
- Orders management (with advanced filtering)
- Product/inventory management
- Category & subcategory management
- Services management
- Booking management
- Customer management
- Marketing campaigns
- Analytics dashboard
- POS (Point of Sale)
- Staff management (invite team members)
- Payout tracking
- Settings (business info, hours, etc.)
- Communications hub

### 2.13 Rider Portal (`/rider/dashboard`)
Dashboard for delivery riders:
- Active orders & deliveries
- Earnings tracking
- Performance analytics
- Business insights
- Customer management
- Communications
- Wallet
- Profile management
- Notifications

### 2.14 Estate Management (`/estate/dashboard`)
For estate/apartment complex managers:
- Resident management
- Vendor management within estate
- Analytics
- Notifications
- Settings
- Profile

---

## 3. User Roles & Access

MtaaLoop uses a **role-based access control** system stored in a dedicated `user_roles` table (not in profiles — for security).

| Role | Description | Dashboard |
|------|------------|-----------|
| `admin` | Platform administrators | `/admin/dashboard` |
| `vendor` | Business owners/operators | `/vendor/dashboard` |
| `rider` | Delivery riders | `/rider/dashboard` |
| `estate_manager` | Estate/apartment managers | `/estate/dashboard` |
| `customer` (default) | Regular users/residents | `/home` |
| `staff` (via `vendor_user_map`) | Vendor team members | `/vendor/dashboard` |

### Authentication Flow
1. User signs up at `/auth/signup`
2. Selects role at `/auth/role-selection`
3. Role-specific signup forms: `/auth/vendor-signup`, `/auth/estate-signup`, `/auth/rider-signup`
4. Vendors/riders/estates go to `/pending-approval` until admin approves
5. Customers select apartment/estate at `/apartment-selection`
6. Staff members join via invite links: `/staff-invite/:token`

### Login Routing Logic (`/auth/login`)
- Checks `user_roles` table for role
- Checks `vendor_user_map` for staff membership
- Vendors → `/vendor/dashboard` (stores `ml_vendor_profile_id` in localStorage)
- Riders → `/rider/dashboard`
- Estate managers → `/estate/dashboard`
- Staff → `/vendor/dashboard` (stores vendor_id + `ml_vendor_staff` flag)
- Customers with estate preference → `/home`
- New customers → `/apartment-selection`

---

## 4. Technical Architecture

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| State | React Context (Cart, Apartment, Address, Gamification, Subscription) + Zustand (rider) |
| Data Fetching | TanStack React Query |
| Routing | React Router v6 |
| Animation | Framer Motion |
| Charts | Recharts + Chart.js |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions + Storage) |
| Real-time | Pusher (WebSocket for live updates) |
| Deployment | Lovable Cloud (Netlify-compatible with `_redirects`) |

### Key Configuration Files
- `src/config/env.ts` — Centralized publishable config (Supabase URL, Pusher keys)
- `src/config/featureFlags.ts` — Feature toggles
- `src/constants/mtaaloopMart.ts` — MtaaLoop Mart vendor ID & name
- `src/constants/categories.ts` — Category definitions
- `src/integrations/supabase/client.ts` — Supabase client instance
- `src/integrations/supabase/types.ts` — Auto-generated DB types (read-only)

### Context Providers (wrapping the app)
1. `ErrorBoundary` — Global error catching
2. `QueryClientProvider` — React Query cache
3. `GamificationProvider` — Points, badges, leaderboard
4. `ApartmentProvider` — Selected estate/apartment
5. `CartProvider` — Shopping cart state
6. `AddressProvider` — Delivery address management
7. `SubscriptionProvider` — User subscription tier

### Edge Functions (Supabase)
| Function | Purpose |
|----------|---------|
| `admin-vendor-payouts` | Process vendor payout requests |
| `generate-image` | AI image generation |
| `get-users` | Admin user listing (bypasses RLS) |
| `pusher-trigger` | Send real-time notifications via Pusher |

---

## 5. Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `user_roles` | Role assignments (admin, vendor, rider, estate_manager) |
| `user_preferences` | User estate/apartment selection |
| `customer_profiles` | Extended customer info (name, phone, dietary prefs, loyalty points) |
| `vendor_profiles` | Business profiles (name, type, address, rating, approval status) |
| `rider_profiles` | Rider info and status |
| `estates` | Estate/apartment complex records |
| `vendor_user_map` | Staff-to-vendor mapping (for team members) |

### Product & Catalog Tables

| Table | Purpose |
|-------|---------|
| `products` | Vendor products (with categories, pricing, stock, customizations) |
| `vendor_categories` | Custom categories per vendor |
| `vendor_subcategories` | Subcategories within vendor categories |
| `big_supermarket_items` | MtaaLoop Mart products (500+ items, 25 categories) |

### Order & Delivery Tables

| Table | Purpose |
|-------|---------|
| `orders` | Customer orders (items, totals, status, payment info) |
| `order_items` | Individual items within an order |
| `deliveries` | Delivery assignments (order → rider mapping) |
| `delivery_order` | Detailed delivery tracking (pickup/dropoff, status, rider) |
| `delivery_events` | Delivery status change log |
| `delivery_offer` | Delivery offers to riders |
| `delivery_addresses` | Saved customer delivery addresses |

### Booking & Consultation Tables

| Table | Purpose |
|-------|---------|
| `booking_service_types` | Bookable service definitions (price, duration, category) |
| `booking_availability` | Vendor weekly availability schedule |
| `booking_time_slots` | Specific bookable time slots |
| `booking_reservations` | Customer bookings |
| `booking_slots` | Product-level booking slots |
| `consultation_types` | Pharmacy consultation types |
| `consultation_availability` | Pharmacist availability |
| `consultation_slots` | Specific consultation time slots |
| `consultation_bookings` | Customer consultation bookings |
| `consultation_pre_info` | Pre-consultation medical forms |

### Community & Social Tables

| Table | Purpose |
|-------|---------|
| `events` | Community events |
| `event_attendees` | Event RSVPs |
| `event_categories` | Event type categories |
| `event_tags` | Event tags |
| `group_rooms` | Group chat rooms |
| `group_room_messages` | Messages in group chats |
| `group_room_participants` | Chat room members |
| `badges` | Gamification badges |

### Analytics & Financial Tables

| Table | Purpose |
|-------|---------|
| `estate_analytics` | Per-estate performance metrics |
| `user_subscriptions` | Active user subscription records |
| `subscription_plans` | Available subscription tiers |
| `rider_wallet_tx` | Rider wallet transactions |

---

## 6. Route Map

### Public Routes
| Route | Page |
|-------|------|
| `/` | Landing Page |
| `/marketplace` | Public marketplace |
| `/auth/signup` | User registration |
| `/auth/login` | Login |
| `/auth/role-selection` | Role picker |
| `/auth/vendor-signup` | Vendor registration |
| `/auth/estate-signup` | Estate manager registration |
| `/auth/rider-signup` | Rider registration |
| `/help` | Help center |
| `/support-live-chat` | Live support chat |
| `/staff-invite/:token` | Staff invitation acceptance |

### Customer Routes (Protected)
| Route | Page |
|-------|------|
| `/home` | Customer home/feed |
| `/mtaaloop-mart` | MtaaLoop Mart shopping |
| `/mtaaloop-minimart` | Minimart browsing |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/orders/:orderId` | Order tracking |
| `/account` | Account overview |
| `/account/addresses` | Saved addresses |
| `/account/payments` | Payment methods |
| `/account/reviews` | User reviews |
| `/account/settings` | Account settings |
| `/account/wallet` | Digital wallet |
| `/account/orders` | Order history |
| `/inbox` | Messages |
| `/refer` | Referral program |
| `/search` | Search results |
| `/my-bookings` | Booking history |
| `/my-consultations` | Consultation history |
| `/quick-services` | On-demand services |
| `/mtaaloop-plus` | Premium subscription |
| `/trash-collection` | Waste management |
| `/image-generator` | AI image tool |

### Category Routes
| Route | Description |
|-------|------------|
| `/food-drinks`, `/food-drinks-db` | Food & Drinks |
| `/shopping`, `/shopping-db` | Shopping |
| `/health`, `/health-db` | Health & Wellness |
| `/beauty`, `/beauty-db` | Beauty & Spa |
| `/home-services`, `/home-services-db` | Home Services |
| `/repairs` | Repair Services |
| `/liquor`, `/liquor-db` | Liquor |
| `/khat` | Khat |
| `/transport`, `/transport-db` | Transport |
| `/essentials`, `/essentials-db` | Living Essentials |
| `/special-occasions`, `/special-occasions-db` | Special Occasions |
| `/pharmacy-db` | Pharmacy |
| `/baby-kids-db` | Baby & Kids |
| `/logistics-db` | Logistics |
| `/accommodation-db` | Accommodation |
| `/flowers-gifts-db` | Flowers & Gifts |
| `/utilities-db` | Utilities |
| `/security-db` | Security |
| `/religious-db` | Religious |
| `/creative-db` | Creative |
| `/construction-db` | Construction |
| `/agriculture-db` | Agriculture |
| `/wedding-db` | Wedding |
| `/categories/:category` | Dynamic category page |

*(Note: `-db` suffix routes pull data from Supabase; non-suffixed are static/hardcoded listings)*

### Subcategory Routes (`/subcategory/...`)
Quick Bites, Fast Food, Beverages, Minimart, Pharmacy, Traditional Kenyan Food, Butchery, Roasted Maize, Roasted Peanuts, Mtura, Fresh Produce, Liquor & Wines, Fashion, Eggs, Jaba, Hair Services, Nails, Massage, Makeup, House Cleaning, Laundry, Carpet Cleaning, Airbnb Cleaning, Borehole Water, Car Wash, Car Hire, Errands, Printing, Water Refills, Gas Refills, House Hunting, Phone/Computer Repairs, Appliance Repairs, Plumbing Repairs, Electrical Repairs, Airbnb Listings, Gift Baskets, Event Planning, Cakes, Party Supplies, Photography, Entertainment

### Admin Routes (`/admin/...`)
| Route | Page |
|-------|------|
| `/admin/dashboard` | Admin overview |
| `/admin/users` | User management |
| `/admin/vendor-approvals` | Approve new vendors |
| `/admin/vendor-management` | Edit vendor details |
| `/admin/estate-approvals` | Approve new estates |
| `/admin/estates/*` | Estate management |
| `/admin/rider-approvals` | Approve new riders |
| `/admin/manage-mtaaloop-mart` | Mart product CRUD |
| `/admin/payouts` | Vendor payouts |
| `/admin/live-chat-assign` | Assign live chat agents |
| `/admin/compliance` | Compliance dashboard |
| `/admin/onboarding` | Onboarding tools |
| `/admin/seed-ilora` | Seed Ilora Flowers vendor |
| `/admin/seed-products` | Seed vendor products |

### Vendor Routes (`/vendor/...`)
| Route | Page |
|-------|------|
| `/vendor/dashboard` | Vendor dashboard |
| `/vendor/orders` | Order management |
| `/vendor/products` | Product management |
| `/vendor/categories` | Category management |
| `/vendor/services` | Service management |
| `/vendor/bookings` | Booking management |
| `/vendor/customers` | Customer CRM |
| `/vendor/marketing` | Marketing campaigns |
| `/vendor/analytics` | Performance analytics |
| `/vendor/minimart` | Minimart management |
| `/vendor/minimart-analytics` | Minimart analytics |
| `/vendor/minimart-customers` | Minimart customers |
| `/vendor/pos` | Point of sale |
| `/vendor/staff` | Staff management |
| `/vendor/settings` | Business settings |
| `/vendor/payouts` | Payout tracking |
| `/vendor/consultations` | Consultation management |
| `/vendor/communications` | Inbox/messages |

### Rider Routes (`/rider/...`)
| Route | Page |
|-------|------|
| `/rider/dashboard` | Rider overview |
| `/rider/profile` | Rider profile |
| `/rider/active-orders` | Current deliveries |
| `/rider/delivery-management` | All deliveries |
| `/rider/earnings` | Earnings tracker |
| `/rider/analytics` | Performance stats |
| `/rider/business-insights` | Business metrics |
| `/rider/customers` | Customer info |
| `/rider/communications` | Messages |
| `/rider/notifications` | Notifications |
| `/rider/wallet` | Rider wallet |
| `/rider/performance` | Performance review |

### Estate Routes (`/estate/...`)
| Route | Page |
|-------|------|
| `/estate/dashboard` | Estate overview |
| `/estate/residents` | Resident management |
| `/estate/vendors` | Vendor management |
| `/estate/analytics` | Estate analytics |
| `/estate/notifications` | Notifications |
| `/estate/settings` | Estate settings |
| `/estate/profile` | Estate profile |

---

## 7. Order Flow & Fulfillment

### Customer Order Flow
1. Customer browses products (vendor store or MtaaLoop Mart)
2. Adds items to cart (`CartContext`)
3. Proceeds to `/checkout`
4. Fills delivery details (estate, house number, phone)
5. Selects payment method (M-Pesa, wallet, cash, card)
6. Order created in `orders` table with `status: 'pending'`
7. Delivery record created in `deliveries` table
8. Order appears in vendor's dashboard

### MtaaLoop Mart Order Flow
- Orders are tagged with `vendor_id: 'b7ad3eb1-b070-4b9d-95b3-b8225340e12b'` (dedicated MtaaLoop Mart vendor)
- Account: `mtaaloop@africall.ke` manages all Mart orders
- MtaaLoop sources and delivers items directly

### Order Statuses
`pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered` | `cancelled`

---

## 8. MtaaLoop Mart (Minimart)

### Overview
- **500+ products** across **25 categories**
- Stored in `big_supermarket_items` table
- Managed via `/admin/manage-mtaaloop-mart`
- Customer-facing at `/mtaaloop-mart`

### Product Fields
| Field | Description |
|-------|------------|
| `product_name` | Product name |
| `clean_name` | Cleaned/normalized name |
| `category` | Product category (25 categories) |
| `price` | Base price (KES) |
| `markup_price` | Selling price with markup |
| `image_url` | Product image (Unsplash URLs) |
| `in_stock` | Stock availability |
| `source_shop` | Original supplier |
| `branch` | Supplier branch |

### Dedicated Vendor Account
- **Vendor ID:** `b7ad3eb1-b070-4b9d-95b3-b8225340e12b`
- **Account:** `mtaaloop@africall.ke`
- **Business Name:** MtaaLoop Mart
- **Fulfillment:** Self-sourced and self-delivered

---

## 9. Vendor System

### Vendor Registration
1. User signs up → selects "Vendor" role
2. Fills vendor signup form (business name, type, phone, address, description)
3. `vendor_profiles` record created with `is_approved: false`
4. Admin approves at `/admin/vendor-approvals`
5. Vendor gains access to `/vendor/dashboard`

### Vendor Profile Fields
Business name, type, description, phone, email, address, logo, banner, cover image, slug, estate association, rating, review count, total orders, tagline, delivery time, delivery fee, hours, years in business, certifications, operational category.

### Product Management
- Vendors create custom categories & subcategories
- Products have: name, description, price, images, stock tracking, customizations, availability toggle
- Support for: regular products, booking services, pharmacy items (with prescription flag)

### Staff Management
- Vendors invite staff via email tokens
- Staff linked via `vendor_user_map` table
- Staff access same vendor dashboard with their own login

### Operational Categories
`inventory` (product-based), `services` (service-based), `booking` (appointment-based), `pharmacy` (health/consultation)

---

## 10. Rider & Delivery System

### Rider Registration
1. User signs up → selects "Rider" role
2. Fills rider-specific form
3. Admin approves at `/admin/rider-approvals`

### Delivery Flow
1. Order placed → delivery record created
2. Available delivery appears in rider's queue
3. Rider accepts delivery
4. Status tracking: `accepted` → `picked_up` → `in_transit` → `delivered`
5. Real-time location tracking via Pusher

### Rider Dashboard Features
- Active deliveries with real-time tracking
- Earnings & wallet management
- Performance analytics
- Customer communication
- Delivery history

### State Management
- `riderStatusStore` (Zustand) — Online/offline toggle, current status
- `riderStore` (Zustand) — Rider profile data
- Location tracking via `useLocationTracking` hook

---

## 11. Estate Management

### Estate Registration
1. Estate manager signs up → selects "Estate" role
2. Fills estate details (name, location, units, amenities, photos)
3. Admin approves at `/admin/estate-approvals`

### Estate Features
- Resident management (who lives where)
- Vendor management (which vendors serve the estate)
- Analytics (orders, revenue, active residents)
- Settings & notifications

### Customer-Estate Association
- Users select their estate at `/apartment-selection`
- Stored in `user_preferences` table (`estate_id`, `apartment_name`)
- Used for delivery routing and vendor filtering

---

## 12. Booking & Consultation System

### Service Bookings
- Vendors define `booking_service_types` (name, price, duration, category)
- Set `booking_availability` (weekly schedule)
- Generate `booking_time_slots` (specific dates/times)
- Customers book via `booking_reservations`

### Pharmacy Consultations
- Pharmacies define `consultation_types` (with prescription requirement flag)
- Set `consultation_availability`
- Generate `consultation_slots`
- Customers book, fill `consultation_pre_info` (symptoms, allergies, medications, medical history)
- Pharmacist reviews and responds with notes

---

## 13. Subscription & Gamification

### Subscription Plans
- Managed via `subscription_plans` and `user_subscriptions` tables
- `SubscriptionContext` provides current plan info app-wide
- UI components: `SubscriptionCard`, `SubscriptionBadge`, `UpgradePrompt`, `UsageTracker`

### Gamification
- `GamificationContext` tracks points, badges, achievements
- `badges` table stores available badges with criteria
- Leaderboard views for estates and users
- Points earned through orders, reviews, referrals

---

## 14. Integrations & Third-Party Services

| Service | Purpose | Configuration |
|---------|---------|--------------|
| **Supabase** | Database, Auth, Storage, Edge Functions | `src/config/env.ts` — Project: `oxehayneipjiozpuxlnv` |
| **Pusher** | Real-time WebSocket notifications | Key: `92acec48c588575d855e`, Cluster: `eu` |
| **Google Maps** | Location/map features (API key not yet configured) | `src/config/env.ts` |

### Supabase Edge Functions
- `admin-vendor-payouts` — Process payout requests
- `generate-image` — AI-powered image generation
- `get-users` — Admin user listing
- `pusher-trigger` — Real-time event broadcasting

---

## 15. Partner Program

### Who MtaaLoop Serves

**For Residents:**
- Order groceries for delivery
- Find trusted local services
- Buy/sell items with neighbors
- Stay updated on local events
- Connect with the community

**For Businesses:**
- Reach local customers digitally
- List products on the Mart
- Receive orders with M-Pesa
- Promote offers to neighborhoods
- Build a verified digital presence

### Partnership Roles Needed
1. **Grocery & FMCG Supply Partners** — Stock the MtaaLoop Mart
2. **Last-Mile Delivery Partners** — Handle hyperlocal deliveries (within 5km, under 60 mins)
3. **Financial & Payment Partners** — M-Pesa STK Push, BNPL, merchant wallets
4. **Technology Partners** — Cloud, SMS/WhatsApp, AI chatbot, mobile app dev
5. **Local Business Anchor Partners** — Established businesses to anchor neighborhoods
6. **Media & Marketing Partners** — Content creators, agencies, community activations

### Partner Tiers

| Tier | Description | Revenue Share |
|------|------------|--------------|
| **Silver** | Entry level — Free listing, basic dashboard, verified badge | 5% |
| **Gold** | Active collaboration — Priority listing, co-marketing, early features | 8% |
| **Platinum / Strategic** | Shape MtaaLoop's future — Advisory Board seat, brand co-ownership, equity conversation | 12% + bonuses |

### Partner Benefits
- Verified Partner Badge
- Revenue share on transactions
- Free business profile/storefront
- Priority listing in search results
- Real-time analytics dashboard
- Co-marketing opportunities
- Board seat eligibility (Platinum)
- Early feature access

### How to Become a Partner
1. Express Interest → partnerships@mtaaloop.com
2. Discovery Call (30-45 min)
3. Tailored Partnership Proposal
4. Sign Partner Agreement
5. Onboarding within 7 business days

---

## 16. Current Status & Roadmap

| Feature | Status |
|---------|--------|
| Platform | ✅ Live and operational on web |
| Mobile App | 🔄 In progress |
| Mart Products | ✅ 500+ products, 25 categories |
| Marketplace | ✅ Active — users can list and buy |
| Services Directory | ✅ Live — accepting registrations |
| Neighbor Connect | ✅ Built — messaging integrated |
| Business Listings | ✅ Open for registration |
| Delivery Network | 🔄 Being established — onboarding riders |
| M-Pesa Integration | 📋 Planned for Q2 2026 |
| Geographic Focus | 📍 Nairobi — expanding Kenya-wide in 2026 |
| Vendor Dashboard | ✅ Full-featured with POS, analytics, staff |
| Rider Dashboard | ✅ Live with earnings, tracking, wallet |
| Estate Management | ✅ Live with analytics |
| Booking System | ✅ Operational for services and consultations |
| Subscription Tiers | ✅ Built — plans configurable |
| Gamification | ✅ Points, badges, leaderboard |
| Admin Panel | ✅ Complete with vendor/rider/estate management |

---

## 17. Contact

**James Melwish | Director, MtaaLoop & Africall Solutions Ltd**

- Email: partnerships@mtaaloop.com / nairobi@mtaaloop.com
- Platform: mtaaloop.com
- Company: africallsolutions.com

---

*This document is confidential and intended solely for the recipient. All partnership terms are indicative and subject to the final signed Partner Agreement.*
