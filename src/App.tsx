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
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRouter } from "./components/RoleRouter";
import Index from "./pages/Index";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import RoleSelection from "./pages/auth/RoleSelection";
import VendorSignup from "./pages/auth/VendorSignup";
import EstateSignup from "./pages/auth/EstateSignup";
import RiderSignup from "./pages/auth/RiderSignup";
import AdminLogin from "./pages/admin/AdminLogin";
import StaffInvite from "./pages/auth/StaffInvite";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import VendorApprovals from "./pages/admin/VendorApprovals";
import EstateApprovals from "./pages/admin/EstateApprovals";
import EstateManagement from "./pages/admin/EstateManagement";
import RiderApprovals from "./pages/admin/RiderApprovals";
import AdminLiveChatAssign from "./pages/AdminLiveChatAssign";
import ManageMtaaLoopMart from "./pages/admin/ManageMtaaLoopMart";
import AdminVendorPayouts from "./pages/admin/AdminVendorPayouts";

// Role-specific dashboards
import RiderDashboard from "./pages/rider/RiderDashboard";
import RiderProfile from "./pages/rider/RiderProfile";
import PendingApproval from "./pages/PendingApproval";
import ApartmentSelection from "./pages/ApartmentSelection";
import Home from "./pages/Home";
import MtaaLoop from "./pages/MtaaLoop";
import MtaaLoopMart from "./pages/MtaaLoopMart";
import MtaaLoopMinimart from "./pages/MtaaLoopMinimart";

// Management Pages for all businesses
import MartManagement from "./pages/MartManagement";
import VendorDetail from "./pages/VendorDetail";
import VendorHome from "./pages/vendor/VendorHome";
import VendorCategory from "./pages/vendor/VendorCategory";
import VendorSubcategory from "./pages/vendor/VendorSubcategory";
import ProductDetail from "./pages/vendor/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaystackCallback from "./pages/PaystackCallback"; // Import the new component
import PaymentCallbackPage from "./pages/PaymentCallbackPage";
import PaymentFailed from "./pages/PaymentFailed"; // Import the new component
import OrderTracking from "./pages/OrderTracking";
import Account from "./pages/Account";
import Addresses from "./pages/account/Addresses";
import PaymentMethods from "./pages/account/PaymentMethods";
import Reviews from "./pages/account/Reviews";
import Settings from "./pages/account/Settings";
import Wallet from "./pages/Wallet";
import Refer from "./pages/Refer";
import MyOrders from "./pages/MyOrders";
import Help from "./pages/Help";
import FoodDrinks from "./pages/categories/FoodDrinks";
import FoodDrinks2 from "./pages/categories/FoodDrinks2";
import Shopping from "./pages/categories/Shopping";
import Shopping2 from "./pages/categories/Shopping2";
import Health from "./pages/categories/Health";
import HealthWellness2 from "./pages/categories/HealthWellness2";
import Beauty from "./pages/categories/Beauty";
import BeautySpa2 from "./pages/categories/BeautySpa2";
import HomeServices from "./pages/categories/HomeServices";
import HomeServices2 from "./pages/categories/HomeServices2";
import Repairs from "./pages/categories/Repairs";
import Liquor from "./pages/categories/Liquor";
import Liquor2 from "./pages/categories/Liquor2";
import Khat from "./pages/categories/Khat";
import Transport from "./pages/categories/Transport";
import TransportCar2 from "./pages/categories/TransportCar2";
import Essentials from "./pages/categories/Essentials";
import LivingEssentials2 from "./pages/categories/LivingEssentials2";
import SpecialOccasions from "./pages/categories/SpecialOccasions";
import SpecialOccasions2 from "./pages/categories/SpecialOccasions2";
import PharmacyPage from "./pages/categories/PharmacyPage";
import BabyKids2 from "./pages/categories/BabyKids2";
import Logistics2 from "./pages/categories/Logistics2";
import Accommodation2 from "./pages/categories/Accommodation2";
import FlowersGifts2 from "./pages/categories/FlowersGifts2";
import Utilities2 from "./pages/categories/Utilities2";
import Security2 from "./pages/categories/Security2";
import Religious2 from "./pages/categories/Religious2";
import Creative2 from "./pages/categories/Creative2";
import Construction2 from "./pages/categories/Construction2";
import Agriculture2 from "./pages/categories/Agriculture2";
import Wedding2 from "./pages/categories/Wedding2";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import QuickBites from "./pages/subcategories/QuickBites";
import FastFood from "./pages/subcategories/FastFood";
import Beverages from "./pages/subcategories/Beverages";
import Minimart from "./pages/subcategories/Minimart";
import Pharmacy from "./pages/subcategories/Pharmacy";
import TraditionalKenyanFood from "./pages/subcategories/TraditionalKenyanFood";
import Butchery from "./pages/subcategories/Butchery";
import RoastedMaize from "./pages/subcategories/RoastedMaize";
import RoastedPeanuts from "./pages/subcategories/RoastedPeanuts";
import Mtura from "./pages/subcategories/Mtura";
import FreshProduce from "./pages/subcategories/FreshProduce";
import LiquorWines from "./pages/subcategories/LiquorWines";
import Fashion from "./pages/subcategories/Fashion";
import Eggs from "./pages/subcategories/Eggs";
import Jaba from "./pages/subcategories/Jaba";
import HairServices from "./pages/subcategories/HairServices";
import Nails from "./pages/subcategories/Nails";
import Massage from "./pages/subcategories/Massage";
import Makeup from "./pages/subcategories/Makeup";
import HouseCleaning from "./pages/subcategories/HouseCleaning";
import Laundry from "./pages/subcategories/Laundry";
import CarpetCleaning from "./pages/subcategories/CarpetCleaning";
import AirbnbCleaning from "./pages/subcategories/AirbnbCleaning";
import BoreholeWater from "./pages/subcategories/BoreholeWater";
import CarWash from "./pages/subcategories/CarWash";
import CarHire from "./pages/subcategories/CarHire";
import Errands from "./pages/subcategories/Errands";
import Printing from "./pages/subcategories/Printing";
import WaterRefills from "./pages/subcategories/WaterRefills";
import GasRefills from "./pages/subcategories/GasRefills";
import HouseHunting from "./pages/subcategories/HouseHunting";
import PhoneComputerRepairs from "./pages/subcategories/PhoneComputerRepairs";
import ApplianceRepairs from "./pages/subcategories/ApplianceRepairs";
import PlumbingRepairs from "./pages/subcategories/PlumbingRepairs";
import ElectricalRepairs from "./pages/subcategories/ElectricalRepairs";
import AirbnbListings from "./pages/subcategories/AirbnbListings";
import GiftBaskets from "./pages/subcategories/GiftBaskets";
import EventPlanning from "./pages/subcategories/EventPlanning";
import Cakes from "./pages/subcategories/Cakes";
import PartySupplies from "./pages/subcategories/PartySupplies";
import Photography from "./pages/subcategories/Photography";
import Entertainment from "./pages/subcategories/Entertainment";
import CategoryPage from "./pages/categories/[category]";

// New Vendor Portal Pages
import NewVendorDashboard from "./pages/vendor/NewVendorDashboard";
import AdvancedOrdersManagement from "./pages/vendor/AdvancedOrdersManagement";
import AdvancedProductManagement from "./pages/vendor/AdvancedProductManagement";
import MinimartManagement from "./pages/vendor/MinimartManagement";
import MinimartAnalytics from "./pages/vendor/MinimartAnalytics";
import MinimartCustomerManagement from "./pages/vendor/MinimartCustomerManagement";
import MinimartPage from "./pages/MinimartPage";
import VendorBookingManagement from "./pages/vendor/VendorBookingManagement";
import VendorCategoryManagement from "./pages/vendor/VendorCategoryManagement";
import VendorServiceManagement from "./pages/vendor/VendorServiceManagement";
import CustomerManagement from "./pages/vendor/CustomerManagement";
import MarketingCampaigns from "./pages/vendor/MarketingCampaigns";
import AnalyticsDashboard from "./pages/vendor/AnalyticsDashboard";
import Inbox from "./pages/Inbox";
import VendorStaff from "./pages/vendor/VendorStaff";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorPayoutsPage from "./pages/vendor/VendorPayoutsPage";
import SupportLiveChat from "./pages/SupportLiveChat";
import TrashCollection from "./pages/TrashCollection";
import TrashTracking from "./pages/TrashTracking";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import MtaaLoopPlus from "./pages/MtaaLoopPlus";
import QuickServices from "./pages/QuickServices";
import OshaViombo from "./pages/services/OshaViombo";
import QuickCleaning from "./pages/services/QuickCleaning";
import LaundrySorting from "./pages/services/LaundrySorting";
import QuickMealPrep from "./pages/services/QuickMealPrep";
import PackageCollection from "./pages/services/PackageCollection";
import ErrandsService from "./pages/services/ErrandsService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GamificationProvider>
      <ApartmentProvider>
        <CartProvider>
          <AddressProvider>
            <SubscriptionProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
        <GlobalLayout>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/role-selection" element={<RoleSelection />} />
            <Route path="/auth/vendor-signup" element={<VendorSignup />} />
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
            <Route path="/payment/callback" element={<PaymentCallbackPage />} />
            <Route path="/paystack/callback" element={<PaystackCallback />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
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
            <Route path="/subcategory/PhoneComouterRepairs" element={<PhoneComputerRepairs />} />
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
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
                <div style={{marginTop:20}}>
                  <a href="/admin/inbox" style={{color:'#2563eb',fontWeight:'bold',textDecoration:'underline'}}>Open Inbox</a>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/admin/inbox" element={
              <ProtectedRoute requiredRole="admin">
                <Inbox />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/vendor-approvals" element={
              <ProtectedRoute requiredRole="admin">
                <VendorApprovals />
              </ProtectedRoute>
            } />
            <Route path="/admin/estate-approvals" element={
              <ProtectedRoute requiredRole="admin">
                <EstateApprovals />
              </ProtectedRoute>
            } />
            <Route path="/admin/estates/*" element={
              <ProtectedRoute requiredRole="admin">
                <EstateManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/rider-approvals" element={
              <ProtectedRoute requiredRole="admin">
                <RiderApprovals />
              </ProtectedRoute>
            } />

            <Route path="/admin/manage-mtaaloop-mart" element={
              <ProtectedRoute requiredRole="admin">
                <ManageMtaaLoopMart />
              </ProtectedRoute>
            } />

            <Route path="/admin/payouts" element={
              <ProtectedRoute requiredRole="admin">
                <AdminVendorPayouts />
              </ProtectedRoute>
            } />

            {/* Admin live chat assignment route */}
            <Route path="/admin/live-chat-assign" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLiveChatAssign />
              </ProtectedRoute>
            } />

            {/* Admin compliance dashboard route */}
            <Route path="/admin/compliance" element={
              <ProtectedRoute requiredRole="admin">
                <ComplianceDashboard />
              </ProtectedRoute>
            } />

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
            {/* 👇 NEW STAFF ROUTE */}
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

            {/* Estate routes - Dashboard removed, estate managers now go through admin */}

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

            {/* Vendor Storefront routes (for customers) - Must come AFTER vendor portal routes */}
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
        </GlobalLayout>
        </BrowserRouter>
              </TooltipProvider>
            </SubscriptionProvider>
          </AddressProvider>
        </CartProvider>
      </ApartmentProvider>
    </GamificationProvider>
  </QueryClientProvider>
);

export default App;
