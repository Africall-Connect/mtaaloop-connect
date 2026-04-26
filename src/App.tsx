import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalLayout } from "@/components/GlobalLayout";
import { CartProvider } from "./contexts/CartContext";
import { ApartmentProvider } from "./contexts/ApartmentContext";
import { AddressProvider } from "./contexts/AddressContext";
import { GamificationProvider } from "./contexts/GamificationContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";


// Eagerly loaded (critical path)
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const RoleSelection = lazy(() => import("./pages/auth/RoleSelection"));
const VendorSignup = lazy(() => import("./pages/auth/VendorSignup"));
const EstateSignup = lazy(() => import("./pages/auth/EstateSignup"));
const RiderSignup = lazy(() => import("./pages/auth/RiderSignup"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const StaffInvite = lazy(() => import("./pages/auth/StaffInvite"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const VendorApprovals = lazy(() => import("./pages/admin/VendorApprovals"));
const EstateApprovals = lazy(() => import("./pages/admin/EstateApprovals"));
const EstateManagement = lazy(() => import("./pages/admin/EstateManagement"));
const RiderApprovals = lazy(() => import("./pages/admin/RiderApprovals"));
const AdminLiveChatAssign = lazy(() => import("./pages/AdminLiveChatAssign"));
const AdminServiceRequests = lazy(() => import("./pages/admin/AdminServiceRequests"));
const ManageMtaaLoopMart = lazy(() => import("./pages/admin/ManageMtaaLoopMart"));
const AdminVendorPayouts = lazy(() => import("./pages/admin/AdminVendorPayouts"));
const AdminOnboarding = lazy(() => import("./pages/admin/AdminOnboarding"));
const SeedIloraFlowers = lazy(() => import("./pages/admin/SeedIloraFlowers"));
const SeedVendorProducts = lazy(() => import("./pages/admin/SeedVendorProducts"));
const AdminVendorManagement = lazy(() => import("./pages/admin/AdminVendorManagement"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminDeliveries = lazy(() => import("./pages/admin/AdminDeliveries"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminWallets = lazy(() => import("./pages/admin/AdminWallets"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));

// CSR (Customer Representative) workspace
const CSRLayout = lazy(() => import("./components/csr/CSRLayout").then(m => ({ default: m.CSRLayout })));
const CSRDashboard = lazy(() => import("./pages/csr/CSRDashboard"));
const CSRChatQueue = lazy(() => import("./pages/csr/CSRChatQueue"));
const CSRInbox = lazy(() => import("./pages/csr/CSRInbox"));
const CSRTickets = lazy(() => import("./pages/csr/CSRTickets"));
const CSRCustomerLookup = lazy(() => import("./pages/csr/CSRCustomerLookup"));
const CSRCustomerDetail = lazy(() => import("./pages/csr/CSRCustomerDetail"));
const CSRCannedResponses = lazy(() => import("./pages/csr/CSRCannedResponses"));
const CSROrders = lazy(() => import("./pages/csr/CSROrders"));
const CSRVendorCampaigns = lazy(() => import("./pages/csr/CSRVendorCampaigns"));
const CSRReviews = lazy(() => import("./pages/csr/CSRReviews"));
const CSRCampaigns = lazy(() => import("./pages/csr/CSRCampaigns"));
const CSRServiceRequests = lazy(() => import("./pages/csr/CSRServiceRequests"));

// Agent
const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));

// Role-specific
const RiderDashboard = lazy(() => import("./pages/rider/RiderDashboard"));
const RiderProfile = lazy(() => import("./pages/rider/RiderProfile"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const ApartmentSelection = lazy(() => import("./pages/ApartmentSelection"));
const Home = lazy(() => import("./pages/Home"));
const MtaaLoop = lazy(() => import("./pages/MtaaLoop"));
const MtaaLoopMart = lazy(() => import("./pages/MtaaLoopMart"));
const MtaaLoopMinimart = lazy(() => import("./pages/MtaaLoopMinimart"));

// Management & vendor
const MartManagement = lazy(() => import("./pages/MartManagement"));
const VendorDetail = lazy(() => import("./pages/VendorDetail"));
const VendorHome = lazy(() => import("./pages/vendor/VendorHome"));
const VendorCategory = lazy(() => import("./pages/vendor/VendorCategory"));
const VendorSubcategory = lazy(() => import("./pages/vendor/VendorSubcategory"));
const ProductDetail = lazy(() => import("./pages/vendor/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Account = lazy(() => import("./pages/Account"));
const Addresses = lazy(() => import("./pages/account/Addresses"));
const PaymentMethods = lazy(() => import("./pages/account/PaymentMethods"));
const Reviews = lazy(() => import("./pages/account/Reviews"));
const Settings = lazy(() => import("./pages/account/Settings"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Refer = lazy(() => import("./pages/Refer"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Help = lazy(() => import("./pages/Help"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Inbox = lazy(() => import("./pages/Inbox"));

// Categories
const FoodDrinks = lazy(() => import("./pages/categories/FoodDrinks"));
const FoodDrinks2 = lazy(() => import("./pages/categories/FoodDrinks2"));
const Shopping = lazy(() => import("./pages/categories/Shopping"));
const Shopping2 = lazy(() => import("./pages/categories/Shopping2"));
const Health = lazy(() => import("./pages/categories/Health"));
const HealthWellness2 = lazy(() => import("./pages/categories/HealthWellness2"));
const Beauty = lazy(() => import("./pages/categories/Beauty"));
const BeautySpa2 = lazy(() => import("./pages/categories/BeautySpa2"));
const HomeServices = lazy(() => import("./pages/categories/HomeServices"));
const HomeServices2 = lazy(() => import("./pages/categories/HomeServices2"));
const Repairs = lazy(() => import("./pages/categories/Repairs"));
const Liquor = lazy(() => import("./pages/categories/Liquor"));
const Liquor2 = lazy(() => import("./pages/categories/Liquor2"));
const Khat = lazy(() => import("./pages/categories/Khat"));
const Transport = lazy(() => import("./pages/categories/Transport"));
const TransportCar2 = lazy(() => import("./pages/categories/TransportCar2"));
const Essentials = lazy(() => import("./pages/categories/Essentials"));
const LivingEssentials2 = lazy(() => import("./pages/categories/LivingEssentials2"));
const SpecialOccasions = lazy(() => import("./pages/categories/SpecialOccasions"));
const SpecialOccasions2 = lazy(() => import("./pages/categories/SpecialOccasions2"));
const PharmacyPage = lazy(() => import("./pages/categories/PharmacyPage"));
const BabyKids2 = lazy(() => import("./pages/categories/BabyKids2"));
const Logistics2 = lazy(() => import("./pages/categories/Logistics2"));
const Accommodation2 = lazy(() => import("./pages/categories/Accommodation2"));
const FlowersGifts2 = lazy(() => import("./pages/categories/FlowersGifts2"));
const Utilities2 = lazy(() => import("./pages/categories/Utilities2"));
const Security2 = lazy(() => import("./pages/categories/Security2"));
const Religious2 = lazy(() => import("./pages/categories/Religious2"));
const Creative2 = lazy(() => import("./pages/categories/Creative2"));
const Construction2 = lazy(() => import("./pages/categories/Construction2"));
const Agriculture2 = lazy(() => import("./pages/categories/Agriculture2"));
const Wedding2 = lazy(() => import("./pages/categories/Wedding2"));
const CategoryPage = lazy(() => import("./pages/categories/[category]"));

// Subcategories
const QuickBites = lazy(() => import("./pages/subcategories/QuickBites"));
const FastFood = lazy(() => import("./pages/subcategories/FastFood"));
const Beverages = lazy(() => import("./pages/subcategories/Beverages"));
const Minimart = lazy(() => import("./pages/subcategories/Minimart"));
const Pharmacy = lazy(() => import("./pages/subcategories/Pharmacy"));
const TraditionalKenyanFood = lazy(() => import("./pages/subcategories/TraditionalKenyanFood"));
const Butchery = lazy(() => import("./pages/subcategories/Butchery"));
const RoastedMaize = lazy(() => import("./pages/subcategories/RoastedMaize"));
const RoastedPeanuts = lazy(() => import("./pages/subcategories/RoastedPeanuts"));
const Mtura = lazy(() => import("./pages/subcategories/Mtura"));
const FreshProduce = lazy(() => import("./pages/subcategories/FreshProduce"));
const LiquorWines = lazy(() => import("./pages/subcategories/LiquorWines"));
const Fashion = lazy(() => import("./pages/subcategories/Fashion"));
const Eggs = lazy(() => import("./pages/subcategories/Eggs"));
const Jaba = lazy(() => import("./pages/subcategories/Jaba"));
const HairServices = lazy(() => import("./pages/subcategories/HairServices"));
const Nails = lazy(() => import("./pages/subcategories/Nails"));
const Massage = lazy(() => import("./pages/subcategories/Massage"));
const Makeup = lazy(() => import("./pages/subcategories/Makeup"));
const HouseCleaning = lazy(() => import("./pages/subcategories/HouseCleaning"));
const Laundry = lazy(() => import("./pages/subcategories/Laundry"));
const CarpetCleaning = lazy(() => import("./pages/subcategories/CarpetCleaning"));
const AirbnbCleaning = lazy(() => import("./pages/subcategories/AirbnbCleaning"));
const BoreholeWater = lazy(() => import("./pages/subcategories/BoreholeWater"));
const CarWash = lazy(() => import("./pages/subcategories/CarWash"));
const CarHire = lazy(() => import("./pages/subcategories/CarHire"));
const Errands = lazy(() => import("./pages/subcategories/Errands"));
const Printing = lazy(() => import("./pages/subcategories/Printing"));
const WaterRefills = lazy(() => import("./pages/subcategories/WaterRefills"));
const GasRefills = lazy(() => import("./pages/subcategories/GasRefills"));
const HouseHunting = lazy(() => import("./pages/subcategories/HouseHunting"));
const PhoneComputerRepairs = lazy(() => import("./pages/subcategories/PhoneComputerRepairs"));
const ApplianceRepairs = lazy(() => import("./pages/subcategories/ApplianceRepairs"));
const PlumbingRepairs = lazy(() => import("./pages/subcategories/PlumbingRepairs"));
const ElectricalRepairs = lazy(() => import("./pages/subcategories/ElectricalRepairs"));
const AirbnbListings = lazy(() => import("./pages/subcategories/AirbnbListings"));
const GiftBaskets = lazy(() => import("./pages/subcategories/GiftBaskets"));
const EventPlanning = lazy(() => import("./pages/subcategories/EventPlanning"));
const Cakes = lazy(() => import("./pages/subcategories/Cakes"));
const PartySupplies = lazy(() => import("./pages/subcategories/PartySupplies"));
const Photography = lazy(() => import("./pages/subcategories/Photography"));
const Entertainment = lazy(() => import("./pages/subcategories/Entertainment"));

// Vendor portal
const NewVendorDashboard = lazy(() => import("./pages/vendor/NewVendorDashboard"));
const AdvancedOrdersManagement = lazy(() => import("./pages/vendor/AdvancedOrdersManagement"));
const AdvancedProductManagement = lazy(() => import("./pages/vendor/AdvancedProductManagement"));
const MinimartManagement = lazy(() => import("./pages/vendor/MinimartManagement"));
const MinimartAnalytics = lazy(() => import("./pages/vendor/MinimartAnalytics"));
const MinimartCustomerManagement = lazy(() => import("./pages/vendor/MinimartCustomerManagement"));
const MinimartPage = lazy(() => import("./pages/MinimartPage"));
const VendorBookingManagement = lazy(() => import("./pages/vendor/VendorBookingManagement"));
const VendorCategoryManagement = lazy(() => import("./pages/vendor/VendorCategoryManagement"));
const VendorServiceManagement = lazy(() => import("./pages/vendor/VendorServiceManagement"));
const CustomerManagement = lazy(() => import("./pages/vendor/CustomerManagement"));
const MarketingCampaigns = lazy(() => import("./pages/vendor/MarketingCampaigns"));
const AnalyticsDashboard = lazy(() => import("./pages/vendor/AnalyticsDashboard"));
const VendorStaff = lazy(() => import("./pages/vendor/VendorStaff"));
const VendorSettings = lazy(() => import("./pages/vendor/VendorSettings"));
const VendorPayoutsPage = lazy(() => import("./pages/vendor/VendorPayoutsPage"));
const PharmacyConsultationManagement = lazy(() => import("./pages/vendor/PharmacyConsultationManagement"));
const VendorPOS = lazy(() => import("./pages/vendor/VendorPOS"));
const VendorNotificationsPage = lazy(() => import("./components/vendor/NotificationsPage"));
const VendorOnboarding = lazy(() => import("./pages/VendorOnboarding"));

// Services & misc
const SupportLiveChat = lazy(() => import("./pages/SupportLiveChat"));
const TrashCollection = lazy(() => import("./pages/TrashCollection"));
const TrashTracking = lazy(() => import("./pages/TrashTracking"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const MtaaLoopPlus = lazy(() => import("./pages/MtaaLoopPlus"));
const QuickServices = lazy(() => import("./pages/QuickServices"));
const OshaViombo = lazy(() => import("./pages/services/OshaViombo"));
const QuickCleaning = lazy(() => import("./pages/services/QuickCleaning"));
const LaundrySorting = lazy(() => import("./pages/services/LaundrySorting"));
const QuickMealPrep = lazy(() => import("./pages/services/QuickMealPrep"));
const PackageCollection = lazy(() => import("./pages/services/PackageCollection"));
const ErrandsService = lazy(() => import("./pages/services/ErrandsService"));
const ServiceTracking = lazy(() => import("./pages/ServiceTracking"));
const MyConsultations = lazy(() => import("./pages/MyConsultations"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ImageGeneratorPage = lazy(() => import("./pages/ImageGenerator"));
const LaunchKit = lazy(() => import("./pages/LaunchKit"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <GamificationProvider>
        <ApartmentProvider>
          <CartProvider>
            <AddressProvider>
              <SubscriptionProvider>
                <NotificationProvider>
                <TooltipProvider>
                
                <Toaster />
                <Sonner />
                <BrowserRouter>
          <GlobalLayout>
            <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/marketplace" element={<Index />} />
            <Route path="/launch-kit" element={<LaunchKit />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/role-selection" element={<RoleSelection />} />
              <Route path="/auth/vendor-signup" element={<VendorSignup />} />
              <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
              <Route path="/auth/estate-signup" element={<EstateSignup />} />
              <Route path="/auth/rider-signup" element={<RiderSignup />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/staff-invite/:token" element={<StaffInvite />} />
              <Route path="/apartment-selection" element={
                <ProtectedRoute>
                  <ApartmentSelection />
                </ProtectedRoute>
              } />
              <Route path="/home" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/mtaaloop-mart" element={
                <ProtectedRoute>
                  <MtaaLoopMart />
                </ProtectedRoute>
              } />
              
              {/* Management Routes for all businesses */}
              <Route path="/management/mart" element={
                <ProtectedRoute requiredRole="admin">
                  <MartManagement />
                </ProtectedRoute>
              } />
              <Route path="/mtaaloop-minimart" element={
                <ProtectedRoute>
                  <MtaaLoopMinimart />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/trash-collection" element={
                <ProtectedRoute>
                  <TrashCollection />
                </ProtectedRoute>
              } />
              <Route path="/mtaaloop-plus" element={
                <ProtectedRoute>
                  <MtaaLoopPlus />
                </ProtectedRoute>
              } />
              <Route path="/quick-services" element={
                <ProtectedRoute>
                  <QuickServices />
                </ProtectedRoute>
              } />
              <Route path="/services/osha-viombo" element={
                <ProtectedRoute>
                  <OshaViombo />
                </ProtectedRoute>
              } />
              <Route path="/services/quick-cleaning" element={
                <ProtectedRoute>
                  <QuickCleaning />
                </ProtectedRoute>
              } />
              <Route path="/services/laundry-sorting" element={
                <ProtectedRoute>
                  <LaundrySorting />
                </ProtectedRoute>
              } />
              <Route path="/services/quick-meal-prep" element={
                <ProtectedRoute>
                  <QuickMealPrep />
                </ProtectedRoute>
              } />
              <Route path="/services/package-collection" element={
                <ProtectedRoute>
                  <PackageCollection />
                </ProtectedRoute>
              } />
              <Route path="/services/errands" element={
                <ProtectedRoute>
                  <ErrandsService />
                </ProtectedRoute>
              } />
              <Route path="/services/trash-collection" element={
                <ProtectedRoute>
                  <TrashCollection />
                </ProtectedRoute>
              } />
              <Route path="/image-generator" element={
                <ProtectedRoute>
                  <ImageGeneratorPage />
                </ProtectedRoute>
              } />
              <Route path="/orders/:orderId" element={
                <ProtectedRoute>
                  <OrderTracking />
                </ProtectedRoute>
              } />
              <Route path="/trash-tracking/:orderId" element={
                <ProtectedRoute>
                  <TrashTracking />
                </ProtectedRoute>
              } />
              <Route path="/service-tracking/:requestId" element={
                <ProtectedRoute>
                  <ServiceTracking />
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />
              <Route path="/account/addresses" element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              } />
              <Route path="/account/payments" element={
                <ProtectedRoute>
                  <PaymentMethods />
                </ProtectedRoute>
              } />
              <Route path="/account/reviews" element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              } />
              <Route path="/account/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/account/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/account/orders" element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              } />
              <Route path="/inbox" element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              } />
              <Route path="/refer" element={
                <ProtectedRoute>
                  <Refer />
                </ProtectedRoute>
              } />
              <Route path="/help" element={<Help />} />
              <Route path="/food-drinks" element={<FoodDrinks />} />
              <Route path="/food-drinks-db" element={
                <ProtectedRoute>
                  <FoodDrinks2 />
                </ProtectedRoute>
              } />
              <Route path="/shopping" element={<Shopping />} />
              <Route path="/shopping-db" element={
                <ProtectedRoute>
                  <Shopping2 />
                </ProtectedRoute>
              } />
              <Route path="/health" element={<Health />} />
              <Route path="/health-db" element={
                <ProtectedRoute>
                  <HealthWellness2 />
                </ProtectedRoute>
              } />
              <Route path="/beauty" element={<Beauty />} />
              <Route path="/beauty-db" element={
                <ProtectedRoute>
                  <BeautySpa2 />
                </ProtectedRoute>
              } />
              <Route path="/home-services" element={<HomeServices />} />
              <Route path="/home-services-db" element={
                <ProtectedRoute>
                  <HomeServices2 />
                </ProtectedRoute>
              } />
              <Route path="/repairs" element={<Repairs />} />
              <Route path="/liquor" element={<Liquor />} />
              <Route path="/liquor-db" element={
                <ProtectedRoute>
                  <Liquor2 />
                </ProtectedRoute>
              } />
              <Route path="/khat" element={<Khat />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/transport-db" element={
                <ProtectedRoute>
                  <TransportCar2 />
                </ProtectedRoute>
              } />
              <Route path="/essentials" element={<Essentials />} />
              <Route path="/essentials-db" element={
                <ProtectedRoute>
                  <LivingEssentials2 />
                </ProtectedRoute>
              } />
              <Route path="/special-occasions" element={<SpecialOccasions />} />
              <Route path="/special-occasions-db" element={
                <ProtectedRoute>
                  <SpecialOccasions2 />
                </ProtectedRoute>
              } />
              <Route path="/pharmacy-db" element={
                <ProtectedRoute>
                  <PharmacyPage />
                </ProtectedRoute>
              } />
              <Route path="/baby-kids-db" element={
                <ProtectedRoute>
                  <BabyKids2 />
                </ProtectedRoute>
              } />
              <Route path="/logistics-db" element={
                <ProtectedRoute>
                  <Logistics2 />
                </ProtectedRoute>
              } />
              <Route path="/accommodation-db" element={
                <ProtectedRoute>
                  <Accommodation2 />
                </ProtectedRoute>
              } />
              <Route path="/flowers-gifts-db" element={
                <ProtectedRoute>
                  <FlowersGifts2 />
                </ProtectedRoute>
              } />
              <Route path="/utilities-db" element={
                <ProtectedRoute>
                  <Utilities2 />
                </ProtectedRoute>
              } />
              <Route path="/security-db" element={
                <ProtectedRoute>
                  <Security2 />
                </ProtectedRoute>
              } />
              <Route path="/religious-db" element={
                <ProtectedRoute>
                  <Religious2 />
                </ProtectedRoute>
              } />
              <Route path="/creative-db" element={
                <ProtectedRoute>
                  <Creative2 />
                </ProtectedRoute>
              } />
              <Route path="/construction-db" element={
                <ProtectedRoute>
                  <Construction2 />
                </ProtectedRoute>
              } />
              <Route path="/agriculture-db" element={
                <ProtectedRoute>
                  <Agriculture2 />
                </ProtectedRoute>
              } />
              <Route path="/wedding-db" element={
                <ProtectedRoute>
                  <Wedding2 />
                </ProtectedRoute>
              } />
              <Route path="/categories/:category" element={<CategoryPage />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/subcategory/quick-bites" element={<QuickBites />} />
              <Route path="/subcategory/fast-food" element={<FastFood />} />
              <Route path="/subcategory/beverages" element={<Beverages />} />
              <Route path="/subcategory/minimart" element={<Minimart />} />
              <Route path="/subcategory/pharmacy" element={<Pharmacy />} />
              <Route path="/subcategory/traditional-kenyan-food" element={<TraditionalKenyanFood />} />
              <Route path="/subcategory/butchery" element={<Butchery />} />
              <Route path="/subcategory/roasted-maize" element={<RoastedMaize />} />
              <Route path="/subcategory/roasted-peanuts" element={<RoastedPeanuts />} />
              <Route path="/subcategory/mtura" element={<Mtura />} />
              <Route path="/subcategory/fresh-produce" element={<FreshProduce />} />
              <Route path="/subcategory/liquor-wines" element={<LiquorWines />} />
              <Route path="/subcategory/fashion" element={<Fashion />} />
              <Route path="/subcategory/eggs" element={<Eggs />} />
              <Route path="/subcategory/jaba" element={<Jaba />} />
              <Route path="/subcategory/hair-services" element={<HairServices />} />
              <Route path="/subcategory/nails" element={<Nails />} />
              <Route path="/subcategory/massage" element={<Massage />} />
              <Route path="/subcategory/makeup" element={<Makeup />} />
              <Route path="/subcategory/house-cleaning" element={<HouseCleaning />} />
              <Route path="/subcategory/laundry" element={<Laundry />} />
              <Route path="/subcategory/carpet-cleaning" element={<CarpetCleaning />} />
              <Route path="/subcategory/airbnb-cleaning" element={<AirbnbCleaning />} />
              <Route path="/subcategory/borehole-water" element={<BoreholeWater />} />
              <Route path="/subcategory/car-wash" element={<CarWash />} />
              <Route path="/subcategory/car-hire" element={<CarHire />} />
              <Route path="/subcategory/errands" element={<Errands />} />
              <Route path="/subcategory/printing" element={<Printing />} />
              <Route path="/subcategory/water-refills" element={<WaterRefills />} />
              <Route path="/subcategory/gas-refills" element={<GasRefills />} />
              <Route path="/subcategory/house-hunting" element={<HouseHunting />} />
              <Route path="/subcategory/PhoneComputerRepairs" element={<PhoneComputerRepairs />} />
              <Route path="/subcategory/appliance-repairs" element={<ApplianceRepairs />} />
              <Route path="/subcategory/plumbing-repairs" element={<PlumbingRepairs />} />
              <Route path="/subcategory/electrical-repairs" element={<ElectricalRepairs />} />
              <Route path="/subcategory/airbnb-listings" element={<AirbnbListings />} />
              <Route path="/subcategory/gift-baskets" element={<GiftBaskets />} />
              <Route path="/subcategory/event-planning" element={<EventPlanning />} />
              <Route path="/subcategory/cakes" element={<Cakes />} />
              <Route path="/subcategory/party-supplies" element={<PartySupplies />} />
              <Route path="/subcategory/photography" element={<Photography />} />
              <Route path="/subcategory/entertainment" element={<Entertainment />} />
              <Route path="/support-live-chat" element={<SupportLiveChat />} />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              
              {/* Admin routes — all wrapped in persistent AdminLayout (sidebar + topbar) */}
              <Route element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/inbox" element={<Inbox />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/vendor-approvals" element={<VendorApprovals />} />
                <Route path="/admin/vendor-management" element={<AdminVendorManagement />} />
                <Route path="/admin/estate-approvals" element={<EstateApprovals />} />
                <Route path="/admin/estates/*" element={<EstateManagement />} />
                <Route path="/admin/rider-approvals" element={<RiderApprovals />} />
                <Route path="/admin/manage-mtaaloop-mart" element={<ManageMtaaLoopMart />} />
                <Route path="/admin/payouts" element={<AdminVendorPayouts />} />
                <Route path="/admin/live-chat-assign" element={<AdminLiveChatAssign />} />
                <Route path="/admin/service-requests" element={<AdminServiceRequests />} />
                <Route path="/admin/compliance" element={<ComplianceDashboard />} />
                <Route path="/admin/onboarding" element={<AdminOnboarding />} />
                <Route path="/admin/seed-ilora" element={<SeedIloraFlowers />} />
                <Route path="/admin/seed-products" element={<SeedVendorProducts />} />
                {/* New admin pages */}
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/deliveries" element={<AdminDeliveries />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/wallets" element={<AdminWallets />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/tickets" element={<AdminTickets />} />
              </Route>

              {/* Agent dashboard (outside admin layout) */}
              <Route path="/agent/dashboard" element={
                <ProtectedRoute requiredRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              } />

              {/* CSR (Customer Representative) workspace */}
              <Route element={<ProtectedRoute requiredRole="customer_rep"><CSRLayout /></ProtectedRoute>}>
                <Route path="/csr/dashboard" element={<CSRDashboard />} />
                <Route path="/csr/queue" element={<CSRChatQueue />} />
                <Route path="/csr/inbox" element={<CSRInbox />} />
                <Route path="/csr/tickets" element={<CSRTickets />} />
                <Route path="/csr/customers" element={<CSRCustomerLookup />} />
                <Route path="/csr/customers/:customerId" element={<CSRCustomerDetail />} />
                <Route path="/csr/canned-responses" element={<CSRCannedResponses />} />
                <Route path="/csr/orders" element={<CSROrders />} />
                <Route path="/csr/vendor-campaigns" element={<CSRVendorCampaigns />} />
                <Route path="/csr/reviews" element={<CSRReviews />} />
                <Route path="/csr/campaigns" element={<CSRCampaigns />} />
                <Route path="/csr/service-requests" element={<CSRServiceRequests />} />
              </Route>

              {/* Vendor routes */}
              <Route path="/vendor/dashboard" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <NewVendorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/vendor/portal" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <NewVendorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/vendor/orders" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <AdvancedOrdersManagement />
                </ProtectedRoute>
              } />
              <Route path="/vendor/categories" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <VendorCategoryManagement />
                </ProtectedRoute>
              } />
              <Route path="/vendor/products" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <AdvancedProductManagement />
                </ProtectedRoute>
              } />
              <Route path="/vendor/pos" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <VendorPOS />
                </ProtectedRoute>
              } />
              <Route path="/vendor/minimart" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <MinimartManagement />
                </ProtectedRoute>
              } />
              <Route
                path="/vendor/services"
                element={
                  <ProtectedRoute requiredRole="vendor" requireApproval>
                    <VendorServiceManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/bookings"
                element={
                  <ProtectedRoute requiredRole="vendor" requireApproval>
                    <VendorBookingManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="/vendor/customers" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <CustomerManagement />
                </ProtectedRoute>
              } />
              <Route path="/vendor/minimart-customers" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <MinimartCustomerManagement />
                </ProtectedRoute>
              } />
              <Route path="/vendor/marketing" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <MarketingCampaigns />
                </ProtectedRoute>
              } />
              <Route path="/vendor/analytics" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/vendor/minimart-analytics" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <MinimartAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/vendor/communications" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <Inbox />
                </ProtectedRoute>
              } />
              <Route
                path="/vendor/staff"
                element={
                  <ProtectedRoute requiredRole="vendor" requireApproval>
                    <VendorStaff />
                  </ProtectedRoute>
                }
              />
              <Route path="/vendor/settings" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <VendorSettings />
                </ProtectedRoute>
              } />

              <Route path="/vendor/payouts" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <VendorPayoutsPage />
                </ProtectedRoute>
              } />
              <Route path="/vendor/consultations" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <PharmacyConsultationManagement />
                </ProtectedRoute>
              } />
              <Route path="/vendor/notifications" element={
                <ProtectedRoute requiredRole="vendor" requireApproval>
                  <VendorNotificationsPage />
                </ProtectedRoute>
              } />

              {/* Customer consultation history */}
              <Route path="/my-consultations" element={
                <ProtectedRoute>
                  <MyConsultations />
                </ProtectedRoute>
              } />

              {/* Rider routes */}
              <Route path="/rider/dashboard" element={
                <ProtectedRoute requiredRole="rider" requireApproval>
                  <RiderDashboard />
                </ProtectedRoute>
              } />
              <Route path="/rider/profile" element={
                <ProtectedRoute requiredRole="rider" requireApproval>
                  <RiderProfile />
                </ProtectedRoute>
              } />

              {/* Vendor Storefront routes (for customers) */}
              <Route path="/vendor/:vendorSlug" element={
                <ProtectedRoute>
                  <VendorHome />
                </ProtectedRoute>
              } />
              <Route path="/vendor/:vendorSlug/category/:categorySlug" element={
                <ProtectedRoute>
                  <VendorCategory />
                </ProtectedRoute>
              } />
              <Route path="/vendor/:vendorSlug/category/:categorySlug/:subcategorySlug" element={
                <ProtectedRoute>
                  <VendorSubcategory />
                </ProtectedRoute>
              } />
              <Route path="/vendor/:vendorSlug/product/:productSlug" element={
                <ProtectedRoute>
                  <ProductDetail />
                </ProtectedRoute>
              } />
              <Route path="/minimart/:vendorId" element={
                <ProtectedRoute>
                  <MinimartPage />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </GlobalLayout>
          </BrowserRouter>
                </TooltipProvider>
                </NotificationProvider>
              </SubscriptionProvider>
            </AddressProvider>
          </CartProvider>
        </ApartmentProvider>
      </GamificationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
