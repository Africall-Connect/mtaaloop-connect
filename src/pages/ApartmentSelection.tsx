import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Estate {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  total_units?: number | null;
  is_approved?: boolean | null;
}

const ApartmentSelection = () => {
  const navigate = useNavigate();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEstate, setSelectedEstate] = useState<Estate | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingEstates, setLoadingEstates] = useState(true);

  // 1. fetch estates from DB
  useEffect(() => {
    const fetchEstates = async () => {
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
        setLoadingEstates(false);
      }
    };

    fetchEstates();
  }, []);

  const filteredEstates = estates.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.location ?? "").toLowerCase().includes(q) ||
      (e.address ?? "").toLowerCase().includes(q)
    );
  });

  const saveSelection = async () => {
    if (!selectedEstate) {
      toast.error("Please select an estate first.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please login again.");
        return navigate("/auth/login");
      }

      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            estate_id: selectedEstate.id,                          // 👈 real DB id
            apartment_name: selectedEstate.name,  // store something if they typed
            house_name: houseNumber || selectedPhase || null,
            extra_directions: null,
            is_primary: true,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      navigate("/home");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save your apartment");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    // must have at least an estate
    if (!selectedEstate) {
      toast.error("Please select an estate first.");
      return;
    }
    void saveSelection();
  };

  const handleSkip = () => {
    // skipping means: save a blank preference so we don't show again
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return navigate("/auth/login");
        await supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, estate_id: null }, { onConflict: "user_id" });

        navigate("/home");
      } catch (e) {
        navigate("/home");
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8">
        {/* STEP 1: choose estate */}
        {!selectedEstate ? (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-2">Welcome to MtaaLoop!</h1>
              <p className="text-muted-foreground">
                Select your estate to see available vendors
              </p>
            </div>

            <div>
              <Label htmlFor="search">Search Estates</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search for your estate..."
                className="mb-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loadingEstates ? (
              <p className="text-center text-muted-foreground">Loading estates...</p>
            ) : filteredEstates.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  No estates found for "{search}"
                </p>
                <Button variant="outline" className="w-full">
                  Can't find your estate?
                </Button>
              </Card>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredEstates.map((estate) => (
                  <Card
                    key={estate.id}
                    className="p-4 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedEstate(estate)}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-8 h-8 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{estate.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {estate.location || estate.address || "No location"}
                        </p>
                      </div>
                      {typeof estate.total_units === "number" && (
                        <span className="text-xs text-muted-foreground">
                          {estate.total_units} units
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Button onClick={handleSkip} variant="outline" className="w-full" size="lg">
              Skip - Use General Location
            </Button>
          </div>
        ) : (
          // STEP 2: details (phase / house)
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-2">Confirm your unit</h1>
              <p className="text-muted-foreground">{selectedEstate.name}</p>
            </div>

            {/* You said: "in select your phase ignore we will fix it later" */}
            {/* so we leave this static for now */}
            <RadioGroup value={selectedPhase} onValueChange={setSelectedPhase}>
              <div className="space-y-3">
                {["Phase 1", "Phase 2", "Phase 3", "Phase 4"].map((phase) => (
                  <Card
                    key={phase}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedPhase === phase ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedPhase(phase)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={phase} id={phase} />
                      <Label htmlFor={phase} className="cursor-pointer flex-1">
                        {phase}
                      </Label>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            <div>
              <Label htmlFor="house">House/Unit Number (Optional)</Label>
              <Input
                id="house"
                type="text"
                placeholder="e.g., B204"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedEstate(null)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleContinue} className="flex-1" size="lg" disabled={saving}>
                {saving ? "Saving..." : "Continue"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ApartmentSelection;
