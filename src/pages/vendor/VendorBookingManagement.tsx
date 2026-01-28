import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Search,
  Clock,
  MapPin,
  Edit,
  CalendarClock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useVendorCategories } from "@/hooks/useVendorCategories";

type BookingProduct = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  is_available: boolean;
  requires_schedule?: boolean;
  requires_address?: boolean;
  created_at: string;
};

type BookingSlot = {
  id: string;
  product_id: string;
  slot_start: string;
  slot_end: string;
  is_available: boolean;
};

export default function VendorBookingManagement() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingProduct | null>(null);
  const [hasCategories, setHasCategories] = useState(false);
  const [checkingCategories, setCheckingCategories] = useState(true);

  // slot management
  const [slotsDialogOpen, setSlotsDialogOpen] = useState(false);
  const [activeProductForSlots, setActiveProductForSlots] = useState<BookingProduct | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);

  const checkCategories = useCallback(async () => {
    try {
      setCheckingCategories(true);
      const vendorProfileId =
        typeof window !== "undefined"
          ? localStorage.getItem("ml_vendor_profile_id")
          : null;

      if (!vendorProfileId) {
        setCheckingCategories(false);
        setLoading(false);
        return;
      }

      const { data: categories } = await supabase
        .from("vendor_categories")
        .select("id")
        .eq("vendor_id", vendorProfileId)
        .limit(1);

      const hasCats = (categories?.length || 0) > 0;
      setHasCategories(hasCats);

      if (!hasCats) {
        toast.error("Please set up your categories first");
        setTimeout(() => {
          navigate("/vendor/categories");
        }, 1500);
      }
    } catch (error) {
      console.error("Error checking categories:", error);
    } finally {
      setCheckingCategories(false);
      setLoading(false);
    }
  }, [navigate]);

  const fetchBookings = useCallback(async () => {
    try {
      const vendorProfileId =
        typeof window !== "undefined"
          ? localStorage.getItem("ml_vendor_profile_id")
          : null;

      if (!vendorProfileId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", vendorProfileId)
        .eq("item_type", "booking")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load booking services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkCategories();
  }, [checkCategories]);

  useEffect(() => {
    if (hasCategories) {
      fetchBookings();
    }
  }, [hasCategories, fetchBookings]);

  const filtered = bookings.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (checkingCategories || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasCategories) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/vendor/portal")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">BOOKING MANAGEMENT</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Alert className="border-amber-500 max-w-2xl mx-auto mt-12">
            <Layers className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-lg font-semibold">Categories Required</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Before you can add booking services, you need to set up your service categories first.
                Categories help organize your bookings (e.g., "Beauty & Spa", "Health & Wellness", "Education").
              </p>
              <p className="text-sm text-muted-foreground">
                This is a one-time setup that will make managing your booking services much easier.
              </p>
              <Button onClick={() => navigate("/vendor/categories")} variant="default">
                <Layers className="mr-2 h-4 w-4" />
                Set Up Categories Now
              </Button>
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const openSlotsDialog = async (product: BookingProduct) => {
    setActiveProductForSlots(product);
    setSlotsDialogOpen(true);
    setSlotLoading(true);
    try {
      const { data, error } = await supabase
        .from("booking_slots")
        .select("*")
        .eq("product_id", product.id)
        .order("slot_start", { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load slots");
    } finally {
      setSlotLoading(false);
    }
  };

  const addSlot = async (slotStart: string, slotEnd: string) => {
    if (!activeProductForSlots) return;
    try {
      const { error } = await supabase.from("booking_slots").insert([
        {
          product_id: activeProductForSlots.id,
          slot_start: slotStart,
          slot_end: slotEnd,
          is_available: true,
        },
      ]);
      if (error) throw error;
      toast.success("Slot added");
      // reload
      const { data } = await supabase
        .from("booking_slots")
        .select("*")
        .eq("product_id", activeProductForSlots.id)
        .order("slot_start", { ascending: true });
      setSlots(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add slot");
    }
  };

  const toggleSlot = async (slot: BookingSlot) => {
    try {
      const { error } = await supabase
        .from("booking_slots")
        .update({ is_available: !slot.is_available })
        .eq("id", slot.id);
      if (error) throw error;
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, is_available: !s.is_available } : s))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update slot");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/portal")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Booking Management
            </h1>
          </div>
          <Button
            onClick={() => {
              setEditingBooking(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Booking Service
          </Button>
        </div>
      </header>

      {/* BODY */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search booking services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No booking services yet. Create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((b) => (
              <Card key={b.id} className="hover:shadow-sm transition">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{b.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{b.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{b.category}</Badge>
                      {b.subcategory && (
                        <Badge variant="secondary">{b.subcategory}</Badge>
                      )}
                    </div>
                    <p className="mt-3 font-bold">KES {b.price.toLocaleString()}</p>
                    {b.requires_address && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        On-site
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={b.is_available ? "default" : "secondary"}>
                      {b.is_available ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBooking(b);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openSlotsDialog(b)}>
                      <CalendarClock className="h-4 w-4 mr-1" />
                      Manage Slots
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* BOOKING FORM */}
      {showForm && (
        <BookingFormDialog
          onClose={() => {
            setShowForm(false);
            setEditingBooking(null);
          }}
          onSuccess={() => {
            fetchBookings();
            setShowForm(false);
            setEditingBooking(null);
          }}
          booking={editingBooking}
        />
      )}

      {/* SLOTS DIALOG */}
      {slotsDialogOpen && activeProductForSlots && (
        <SlotsDialog
          product={activeProductForSlots}
          slots={slots}
          loading={slotLoading}
          onClose={() => {
            setSlotsDialogOpen(false);
            setActiveProductForSlots(null);
            setSlots([]);
          }}
          onAddSlot={addSlot}
          onToggleSlot={toggleSlot}
        />
      )}
    </div>
  );
}

/* ---------------------------
   BookingFormDialog
---------------------------- */
function BookingFormDialog({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookingProduct | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    is_available: true,
    requires_address: true,
  });
  const [loading, setLoading] = useState(false);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);

  // Load dynamic vendor categories
  const { categories, subcategories, loading: categoriesLoading } = useVendorCategories(vendorProfileId);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const id =
          typeof window !== "undefined"
            ? localStorage.getItem("ml_vendor_profile_id")
            : null;

        if (id) {
          setVendorProfileId(id);
        } else {
          toast.error("Vendor profile not found");
        }
      } catch (err) {
        console.error("Error loading vendor profile:", err);
        toast.error("Failed to load vendor profile");
      } finally {
        setVendorLoading(false);
      }
    };

    loadVendor();
  }, []);

  useEffect(() => {
    if (booking) {
      setForm({
        name: booking.name,
        description: booking.description || "",
        category: booking.category,
        subcategory: booking.subcategory || "",
        price: booking.price.toString(),
        is_available: booking.is_available,
        requires_address: booking.requires_address ?? true,
      });
    }
  }, [booking]);

  // Derive subcategories for current category
  const selectedCategory = categories.find(cat => cat.name === form.category);
  const currentSubcategories = selectedCategory
    ? subcategories.filter(sub => sub.category_id === selectedCategory.id)
    : [];

  const handleCategoryChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      category: value,
      subcategory: "", // Reset subcategory when category changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorProfileId) {
      toast.error("Vendor profile not found");
      return;
    }
    setLoading(true);

    try {
      const baseData = {
        vendor_id: vendorProfileId,
        name: form.name,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory || null,
        price: parseFloat(form.price),
        is_available: form.is_available,
        item_type: "booking",
        fulfillment_mode: form.requires_address ? "on_site" : "remote",
        requires_address: form.requires_address,
        requires_schedule: true,
        unit_type: "session",
      };

      if (booking) {
        const { error } = await supabase
          .from("products")
          .update(baseData)
          .eq("id", booking.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([baseData]);
        if (error) throw error;
      }

      toast.success(booking ? "Booking service updated" : "Booking service created");
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to save booking", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Booking Service" : "Add Booking Service"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {vendorLoading && (
            <p className="text-xs text-muted-foreground">Loading vendor profile...</p>
          )}
          {!vendorLoading && !vendorProfileId && (
            <p className="text-xs text-destructive">Vendor profile not found.</p>
          )}

          <div className="space-y-2">
            <Label>Service Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g., Spa Treatment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                disabled={categoriesLoading}
              >
                <option value="" disabled>
                  {categoriesLoading ? 'Loading categories...' : 'Select category'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-muted-foreground">
                  No categories found. Please set up categories first.
                </p>
              )}
            </div>

            {/* Subcategory (only show when category has children) */}
            {form.category && currentSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <select
                  id="subcategory"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  disabled={categoriesLoading}
                >
                  <option value="">Select subcategory (optional)</option>
                  {currentSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Base Price (KES) *</Label>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div>
              <Label>On-site (needs customer location)</Label>
              <p className="text-xs text-muted-foreground">Turn off for remote/online sessions</p>
            </div>
            <Switch
              checked={form.requires_address}
              onCheckedChange={(v) => setForm({ ...form, requires_address: v })}
            />
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div>
              <Label>Available</Label>
              <p className="text-xs text-muted-foreground">Allow customers to book</p>
            </div>
            <Switch
              checked={form.is_available}
              onCheckedChange={(v) => setForm({ ...form, is_available: v })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : booking ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------
   SlotsDialog
---------------------------- */
function SlotsDialog({
  product,
  slots,
  loading,
  onClose,
  onAddSlot,
  onToggleSlot,
}: {
  product: BookingProduct;
  slots: BookingSlot[];
  loading: boolean;
  onClose: () => void;
  onAddSlot: (start: string, end: string) => void;
  onToggleSlot: (slot: BookingSlot) => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;
    onAddSlot(start, end);
    setStart("");
    setEnd("");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Slots — {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAdd} className="grid grid-cols-3 gap-3 mb-4">
          <div className="space-y-1 col-span-1">
            <Label>Start</Label>
            <Input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 col-span-1">
            <Label>End</Label>
            <Input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Add Slot
            </Button>
          </div>
        </form>

        {loading ? (
          <p>Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No slots yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {slots.map((slot) => (
              <Card key={slot.id}>
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      {new Date(slot.slot_start).toLocaleString()} →
                      {new Date(slot.slot_end).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={slot.is_available ? "default" : "secondary"}>
                      {slot.is_available ? "Available" : "Taken / Hidden"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onToggleSlot(slot)}>
                      Toggle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
