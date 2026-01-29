
# Order Tracking Status Messaging Redesign

## Overview

This plan redesigns the order tracking status messaging in `src/pages/OrderTracking.tsx` to provide category-appropriate wording for all 9 main categories. Currently, only "Liquor Store" and "Pharmacy" have tailored messaging, but customers ordering toiletries, groceries, or home services should not see "Preparing your food."

---

## The Problem

When a customer orders:
- **Toiletries** from Living Essentials → sees "Preparing your food" ❌
- **Gas Delivery** from Utilities & Services → sees "Preparing your food" ❌  
- **Cleaning Service** from Home Services → sees "Preparing your food" ❌

This creates a confusing and unprofessional user experience.

---

## New Category-Specific Messaging Structure

### Mapping Table: Category → Status Messages

| Category | Icon | "Preparing" Title | "Preparing" Description | Notification Title |
|----------|------|-------------------|-------------------------|-------------------|
| **Food & Drinks** | 👨‍🍳 | Preparing your order | Your delicious order is being prepared with care | Cooking Started! |
| **Restaurant** | 👨‍🍳 | Preparing your meal | Your meal is being freshly prepared | Cooking Started! |
| **Living Essentials** | 🧴 | Packing your items | Your items are being carefully packed | Packing Started! |
| **Groceries & Food** | 🛒 | Packing your groceries | Your groceries are being carefully packed | Packing Started! |
| **Utilities & Services** | 🔧 | Preparing your service | Your service request is being prepared | Service Preparing! |
| **Home Services** | 🏠 | Preparing your service | Your home service is being arranged | Service Preparing! |
| **Beauty & Spa** | 💅 | Preparing your appointment | Your appointment is being prepared | Appointment Ready! |
| **Accommodation** | 🏨 | Preparing your stay | Your accommodation is being prepared | Booking Confirmed! |
| **Pharmacy** | 💊 | Preparing your medication | Your medication is being carefully prepared | Medication Ready! |

---

## Technical Implementation

### Step 1: Create a Helper Configuration Object

Create a new configuration object that maps categories to their messaging details:

```typescript
// Category-specific messaging configuration
const CATEGORY_MESSAGING = {
  // Inventory Categories
  "Food & Drinks": {
    icon: "👨‍🍳",
    preparingTitle: "Preparing your order",
    preparingDescription: "Your delicious order is being prepared with care",
    notificationTitle: "Cooking Started! 👨‍🍳",
    timelineLabel: "Preparing Your Order",
    deliveredMessage: "Enjoy your meal!",
  },
  "Restaurant": {
    icon: "👨‍🍳",
    preparingTitle: "Preparing your meal",
    preparingDescription: "Your meal is being freshly prepared",
    notificationTitle: "Cooking Started! 👨‍🍳",
    timelineLabel: "Preparing Your Meal",
    deliveredMessage: "Enjoy your meal!",
  },
  "Living Essentials": {
    icon: "🧴",
    preparingTitle: "Packing your items",
    preparingDescription: "Your items are being carefully packed",
    notificationTitle: "Packing Started! 📦",
    timelineLabel: "Packing Your Items",
    deliveredMessage: "Enjoy your items!",
  },
  "Groceries & Food": {
    icon: "🛒",
    preparingTitle: "Packing your groceries",
    preparingDescription: "Your groceries are being carefully packed",
    notificationTitle: "Packing Started! 🛒",
    timelineLabel: "Packing Your Groceries",
    deliveredMessage: "Enjoy your groceries!",
  },
  // Service Categories
  "Utilities & Services": {
    icon: "🔧",
    preparingTitle: "Preparing your service",
    preparingDescription: "Your service request is being prepared",
    notificationTitle: "Service Preparing! 🔧",
    timelineLabel: "Preparing Your Service",
    deliveredMessage: "Service complete!",
  },
  "Home Services": {
    icon: "🏠",
    preparingTitle: "Preparing your service",
    preparingDescription: "Your home service is being arranged",
    notificationTitle: "Service Preparing! 🏠",
    timelineLabel: "Arranging Your Service",
    deliveredMessage: "Service complete!",
  },
  // Booking Categories
  "Beauty & Spa": {
    icon: "💅",
    preparingTitle: "Preparing your appointment",
    preparingDescription: "Your appointment is being prepared",
    notificationTitle: "Appointment Ready! 💅",
    timelineLabel: "Preparing Your Appointment",
    deliveredMessage: "Thank you for your visit!",
  },
  "Accommodation": {
    icon: "🏨",
    preparingTitle: "Preparing your stay",
    preparingDescription: "Your accommodation is being prepared",
    notificationTitle: "Booking Confirmed! 🏨",
    timelineLabel: "Preparing Your Stay",
    deliveredMessage: "Enjoy your stay!",
  },
  // Pharmacy (Hybrid)
  "Pharmacy": {
    icon: "💊",
    preparingTitle: "Preparing your medication",
    preparingDescription: "Your medication is being carefully prepared",
    notificationTitle: "Medication Ready! 💊",
    timelineLabel: "Preparing Your Medication",
    deliveredMessage: "Take care of yourself!",
  },
  // Legacy support
  "Liquor Store": {
    icon: "🍷",
    preparingTitle: "Preparing your drinks",
    preparingDescription: "Your drinks are being prepared",
    notificationTitle: "Drinks Preparing! 🍷",
    timelineLabel: "Preparing Your Drinks",
    deliveredMessage: "Enjoy responsibly!",
  },
};

// Default fallback for unknown categories
const DEFAULT_MESSAGING = {
  icon: "📦",
  preparingTitle: "Preparing your order",
  preparingDescription: "Your order is being prepared",
  notificationTitle: "Order Preparing! 📦",
  timelineLabel: "Preparing Your Order",
  deliveredMessage: "Enjoy!",
};
```

### Step 2: Create Helper Function

Create a helper function to get the messaging config for a category:

```typescript
const getCategoryMessaging = (category: string | null | undefined) => {
  if (!category) return DEFAULT_MESSAGING;
  return CATEGORY_MESSAGING[category] || DEFAULT_MESSAGING;
};
```

### Step 3: Update `getStatusLabel()` Function (Lines 456-486)

Replace the hardcoded category checks with the helper:

```typescript
const getStatusLabel = (status: string, isPremium = false) => {
  if (isPremium) {
    // ... existing premium logic unchanged
  }
  
  const messaging = getCategoryMessaging(orderData?.category);
  
  switch (status) {
    case "pending": return "Waiting for vendor to accept";
    case "accepted": return "Vendor accepted your order";
    case "preparing": return messaging.preparingTitle;
    case "ready": return "Ready for pickup";
    case "in_transit": return "Out for delivery";
    case "delivered": return "Delivered";
    case "cancelled": return "Order cancelled";
    default: return "Processing order";
  }
};
```

### Step 4: Update Status Card Icon (Lines 1045-1054)

Replace hardcoded emoji logic:

```typescript
<span className="text-4xl">
  {orderStatus === "pending"
    ? "⏰"
    : orderStatus === "accepted" || orderStatus === "preparing"
    ? getCategoryMessaging(orderData?.category).icon
    : "🚴"}
</span>
```

### Step 5: Update Status Description (Lines 1059-1067)

Replace hardcoded description:

```typescript
<p className="text-muted-foreground mb-2">
  {orderStatus === "pending" && "Your order will be confirmed shortly"}
  {orderStatus === "accepted" && "The vendor is preparing your order"}
  {orderStatus === "preparing" && getCategoryMessaging(orderData?.category).preparingDescription}
  {orderStatus === "ready" && "Your order is ready for pickup"}
  {orderStatus === "in_transit" && "Arriving soon"}
</p>
```

### Step 6: Update Timeline Steps (Lines 1119-1137)

Replace the "preparing" step with dynamic messaging:

```typescript
{
  label: getCategoryMessaging(orderData?.category).timelineLabel,
  status: "preparing",
  done: ["preparing", "ready", "in_transit", "delivered"].includes(orderStatus),
  icon: getCategoryMessaging(orderData?.category).icon,
  description: getCategoryMessaging(orderData?.category).preparingDescription
},
```

### Step 7: Update Realtime Notifications (Lines 154-185)

Make notifications category-aware:

```typescript
// In the realtime subscription handler
const messaging = getCategoryMessaging(orderData?.category);
const statusMessages: Record<string, { title: string; description: string; emoji: string }> = {
  accepted: {
    title: "Order Confirmed! 🎉",
    description: "The vendor has accepted your order and will start soon.",
    emoji: "✅"
  },
  preparing: {
    title: messaging.notificationTitle,
    description: messaging.preparingDescription,
    emoji: messaging.icon
  },
  // ... other statuses remain generic
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/OrderTracking.tsx` | Add CATEGORY_MESSAGING config, getCategoryMessaging() helper, update 6 locations that display status text |

---

## Implementation Summary

1. **Add** `CATEGORY_MESSAGING` object with all 9+ categories (around line 67, after imports)
2. **Add** `DEFAULT_MESSAGING` fallback object
3. **Add** `getCategoryMessaging()` helper function
4. **Update** `getStatusLabel()` to use helper
5. **Update** status card icon to use helper
6. **Update** status description to use helper
7. **Update** timeline "preparing" step to use helper
8. **Update** realtime notification to use helper

---

## Example User Experiences After Implementation

### Living Essentials (Toiletries)
- **Icon**: 🧴
- **Title**: "Packing your items"
- **Description**: "Your items are being carefully packed"
- **Timeline**: "Packing Your Items"

### Utilities & Services (Gas Delivery)
- **Icon**: 🔧
- **Title**: "Preparing your service"
- **Description**: "Your service request is being prepared"
- **Timeline**: "Preparing Your Service"

### Beauty & Spa (Hair Salon)
- **Icon**: 💅
- **Title**: "Preparing your appointment"
- **Description**: "Your appointment is being prepared"
- **Timeline**: "Preparing Your Appointment"

---

## Legacy Support

The configuration includes "Liquor Store" for backwards compatibility with existing orders that may have this category value in the database.

---

## Benefits

1. **Professional UX** - Customers see contextually appropriate messaging
2. **Maintainable** - Single configuration object for all categories
3. **Extensible** - Easy to add new categories in the future
4. **Type-safe** - Clear structure prevents messaging errors
5. **Fallback** - Unknown categories still get reasonable messaging
