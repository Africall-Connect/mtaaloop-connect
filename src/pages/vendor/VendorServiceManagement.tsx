// src/pages/vendor/VendorServiceManagement.tsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Plus, Wrench, Search, Layers } from "lucide-react";
import { toast } from "sonner";
import ServiceFormDialog from "@/components/vendor/service/ServiceFormDialog";

interface ServiceProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

export default function VendorServiceManagement() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceProduct | null>(null);
  const [hasCategories, setHasCategories] = useState(false);
  const [checkingCategories, setCheckingCategories] = useState(true);

  useEffect(() => {
    checkCategories();
  }, [checkCategories]);

  useEffect(() => {
    if (hasCategories) {
      fetchServices();
    }
  }, [hasCategories, fetchServices]);

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

  const fetchServices = useCallback(async () => {
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
        .eq("item_type", "service")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="text-2xl font-bold text-gray-900">SERVICE MANAGEMENT</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Alert className="border-amber-500 max-w-2xl mx-auto mt-12">
            <Layers className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-lg font-semibold">Categories Required</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Before you can add services, you need to set up your service categories first.
                Categories help organize your services (e.g., "Plumbing", "Electrical", "Cleaning").
              </p>
              <p className="text-sm text-muted-foreground">
                This is a one-time setup that will make managing your services much easier.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/portal")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" /> Service Management
            </h1>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No services yet. Add your first service.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((service) => (
              <Card key={service.id} className="hover:shadow-sm transition">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{service.category}</Badge>
                      {service.subcategory && <Badge variant="secondary">{service.subcategory}</Badge>}
                    </div>
                    <p className="mt-3 font-bold">KES {service.price.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={service.is_available ? "default" : "secondary"}>
                      {service.is_available ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingService(service);
                      setShowForm(true);
                    }}>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <ServiceFormDialog
          service={editingService}
          onClose={() => {
            setShowForm(false);
            setEditingService(null);
          }}
          onSuccess={() => {
            fetchServices();
            setShowForm(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}
