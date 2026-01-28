import { useState, useEffect } from "react";
import { Building2, Search, Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Apartment {
  id: string;
  name: string;
  location?: string | null;
  address?: string | null;
  total_units?: number | null;
}

interface ApartmentSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentApartment: Apartment | null;
  onApartmentSelect: (apartment: Apartment) => void;
}

export function ApartmentSwitcher({
  open,
  onOpenChange,
  currentApartment,
  onApartmentSelect,
}: ApartmentSwitcherProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [estates, setEstates] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // fetch estates from DB
  useEffect(() => {
    if (!open) return; // only load when modal opens
    const fetchEstates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("estates")
          .select("id, name, location, address, total_units, is_approved")
          .eq("is_approved", true)
          .order("name", { ascending: true });

        if (error) throw error;
        setEstates(data || []);
      } catch (err) {
        console.error("Error loading estates:", err);
        toast.error("Failed to load estates");
      } finally {
        setLoading(false);
      }
    };

    fetchEstates();
  }, [open]);

  const filtered = estates.filter((apt) =>
    `${apt.name} ${apt.location ?? ""} ${apt.address ?? ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSelect = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setIsConfirming(true);
  };

  const handleConfirm = async () => {
    if (!selectedApartment) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        const { error } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: user.id,
            estate_id: selectedApartment.id,
            apartment_name: selectedApartment.name,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (error) throw error;
        
        toast.success(`Preference updated to ${selectedApartment.name}`);
      } catch (err) {
        console.error("Failed to update preference:", err);
        toast.error("Could not save your preference.");
      }
    }

    onApartmentSelect(selectedApartment);
    setIsConfirming(false);
    setSelectedApartment(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !isConfirming} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Your Apartment</DialogTitle>
            <DialogDescription>
              Select a different apartment building to see its marketplace
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search apartments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Apartment List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading apartments...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No apartments found.</p>
            ) : (
              filtered.map((apartment) => {
                const isSelected = currentApartment?.id === apartment.id;
                return (
                  <button
                    key={apartment.id}
                    onClick={() => handleSelect(apartment)}
                    className={`w-full p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left ${
                      isSelected ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <p className="font-medium text-foreground">
                            {apartment.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apartment.location || apartment.address || "No location"}
                          </p>
                          {typeof apartment.total_units === "number" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {apartment.total_units} units
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Register New Apartment */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
              onClick={() => {
                navigate("/apartment-selection");
                onOpenChange(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Register New Apartment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Location Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to switch to{" "}
              <span className="font-bold">{selectedApartment?.name}</span>? This will
              update your preference and refresh your marketplace view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedApartment(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm & Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
