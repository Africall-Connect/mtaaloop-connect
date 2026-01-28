
# MTAA Loop Connect - Hybrid Marketplace Platform

## Overview
A modern, community-focused marketplace where users can buy/sell products AND offer/find services. Features real-time chat powered by Pusher, Supabase authentication, and external payment integration (M-Pesa, etc.).

---

## Core Features

### 1. Authentication & User Management
- **Sign up / Login** with email and password via Supabase Auth
- **User profiles** with avatar, bio, location, and contact info
- **Three user roles**: Buyer, Seller/Provider, Admin
- Users can switch between buying and selling modes
- Profile verification badges for trusted sellers

### 2. Marketplace Listings
- **Dual listing types**: Products (items for sale) AND Services (offered services)
- Each listing includes: title, description, category, price, images, location
- **Categories** for both products (electronics, fashion, home, etc.) and services (repairs, tutoring, delivery, etc.)
- Search and filter by category, price range, location, listing type
- Save/favorite listings feature

### 3. Real-Time Chat (Pusher)
- **Direct messaging** between buyers and sellers
- Chat appears when user clicks "Contact Seller" on a listing
- Real-time message delivery with read receipts
- Chat history preserved in Supabase
- Notification badges for new messages

### 4. External Payments
- Sellers can add their **payment links** (M-Pesa, bank transfer, PayPal, etc.)
- "Pay Now" button opens external payment link
- Transaction status tracked manually (pending, completed, disputed)
- Payment instructions displayed in chat

### 5. Admin Dashboard
- **Moderation tools**: approve/reject listings, manage users
- View reported content and resolve disputes
- Platform analytics (users, listings, active chats)
- Manage categories and featured listings

---

## User Experience Flow

### For Buyers
1. Browse/search marketplace → View listing details
2. Click "Contact Seller" → Real-time chat opens
3. Negotiate and agree on terms
4. Click payment link → Complete payment externally
5. Mark transaction as complete

### For Sellers
1. Create profile → Add payment method links
2. Post listings (product or service)
3. Receive chat inquiries in real-time
4. Confirm payment received → Mark complete

---

## Design Direction
- **Trendy, community feel** with vibrant accent colors
- Card-based layout for listings with large images
- Mobile-first responsive design
- Smooth animations and micro-interactions
- Dark mode support

---

## Pages to Build
1. **Landing/Home** - Featured listings, categories, search
2. **Browse/Search** - Filtered marketplace view
3. **Listing Detail** - Full listing info + contact seller
4. **Create Listing** - Form for products/services
5. **My Listings** - Seller's dashboard
6. **Chat/Messages** - Real-time conversations
7. **Profile** - User profile + settings
8. **Admin Panel** - Moderation & analytics
9. **Auth Pages** - Login, signup, password reset

---

## Technical Implementation
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (auth, database, storage for images)
- **Real-time**: Pusher for instant chat messaging
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query for data fetching

This plan creates a fully functional hybrid marketplace with a vibrant community feel, ready for your users to buy, sell, and connect!
