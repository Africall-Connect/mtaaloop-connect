import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, FileText, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { FileUploadZone } from "@/components/estate/FileUploadZone";
import { AmenityPicker } from "@/components/estate/AmenityPicker";
import { ErrorResponse } from "@/types/common";

const KENYA_COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi", "Kitale", "Garissa", "Kakamega", "Naivasha", "Nyeri", "Machakos", "Meru"];
const ESTATE_TYPES = [
  { value: "apartment_complex", label: "Apartment Complex" },
  { value: "gated_community", label: "Gated Community" },
  { value: "residential_estate", label: "Residential Estate" },
  { value: "mixed_use_development", label: "Mixed-Use Development" },
  { value: "townhouse_complex", label: "Townhouse Complex" },
  { value: "condominiums", label: "Condominiums" }
];

type UploadedFile = { id: string; name: string; size: number; type: string; url?: string; preview?: string; };

export default function EstateSignup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estateInfo, setEstateInfo] = useState({ estateName: "", estateType: "apartment_complex", totalUnits: 50, location: "", address: "", postalCode: "", county: "", description: "" });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [documentation, setDocumentation] = useState({ estatePhotos: [] as UploadedFile[] });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!estateInfo.estateName || !estateInfo.location || !estateInfo.county || !estateInfo.address) {
          toast.error("Please fill in all required estate information");
          return false;
        }
        return true;
      case 2:
        return true; // Amenities are optional
      case 3:
        return true; // Photos are optional
      default:
        return true;
    }
  };

  const nextStep = () => { if (validateStep(currentStep)) { setCurrentStep(Math.min(currentStep + 1, totalSteps)); window.scrollTo(0, 0); } };
  const prevStep = () => { setCurrentStep(Math.max(currentStep - 1, 1)); window.scrollTo(0, 0); };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    try {
      const slug = estateInfo.estateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error: estateError } = await supabase.from("estates").insert({
        name: estateInfo.estateName, slug, estate_type: estateInfo.estateType, location: estateInfo.location, county: estateInfo.county, address: estateInfo.address,
        postal_code: estateInfo.postalCode, total_units: estateInfo.totalUnits, description: estateInfo.description,
        amenities: selectedAmenities, is_approved: false
      });
      if (estateError) throw estateError;
      toast.success("Estate registration submitted successfully!");
      navigate("/pending-approval");
    } catch (error) {
      const err = error as ErrorResponse;
      toast.error(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div><CardTitle className="text-2xl">Estate Registration</CardTitle><CardDescription>Step {currentStep} of {totalSteps}</CardDescription></div>
            <Badge variant="outline" className="text-lg px-4 py-2">{Math.round(progress)}%</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>
                <div><h2 className="text-2xl font-bold">Estate Information</h2><p className="text-sm text-muted-foreground">Details about your estate</p></div>
              </div>
              <div className="space-y-4">
                <div><Label htmlFor="estateName">Estate Name <span className="text-destructive">*</span></Label><Input id="estateName" value={estateInfo.estateName} onChange={(e) => setEstateInfo({ ...estateInfo, estateName: e.target.value })} placeholder="Greenview Estate" /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label htmlFor="estateType">Estate Type <span className="text-destructive">*</span></Label>
                    <Select value={estateInfo.estateType} onValueChange={(value) => setEstateInfo({ ...estateInfo, estateType: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ESTATE_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Total Units</Label>
                    <div className="flex items-center gap-4">
                      <Slider value={[estateInfo.totalUnits]} onValueChange={([value]) => setEstateInfo({ ...estateInfo, totalUnits: value })} min={1} max={500} className="flex-1" />
                      <Badge variant="outline" className="min-w-[60px] justify-center">{estateInfo.totalUnits}</Badge>
                    </div>
                  </div>
                </div>
                <div><Label htmlFor="description">Description (Optional)</Label><Textarea id="description" value={estateInfo.description} onChange={(e) => setEstateInfo({ ...estateInfo, description: e.target.value })} rows={2} /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label htmlFor="location">Location <span className="text-destructive">*</span></Label><Input id="location" value={estateInfo.location} onChange={(e) => setEstateInfo({ ...estateInfo, location: e.target.value })} placeholder="Karen, Nairobi" /></div>
                  <div><Label htmlFor="county">County <span className="text-destructive">*</span></Label>
                    <Select value={estateInfo.county} onValueChange={(value) => setEstateInfo({ ...estateInfo, county: value })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{KENYA_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label htmlFor="address">Address <span className="text-destructive">*</span></Label><Input id="address" value={estateInfo.address} onChange={(e) => setEstateInfo({ ...estateInfo, address: e.target.value })} /></div>
                  <div><Label htmlFor="postalCode">Postal Code</Label><Input id="postalCode" value={estateInfo.postalCode} onChange={(e) => setEstateInfo({ ...estateInfo, postalCode: e.target.value })} /></div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Check className="h-6 w-6 text-primary" /></div>
                <div><h2 className="text-2xl font-bold">Estate Amenities</h2><p className="text-sm text-muted-foreground">Select available amenities</p></div>
              </div>
              <AmenityPicker selectedAmenities={selectedAmenities} onChange={setSelectedAmenities} />
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><FileText className="h-6 w-6 text-primary" /></div>
                <div><h2 className="text-2xl font-bold">Estate Photos</h2><p className="text-sm text-muted-foreground">Upload photos of your estate</p></div>
              </div>
              <div className="space-y-6">
                <FileUploadZone title="Estate Photos" description="Photos of your estate (optional)" acceptedFileTypes="image/*" maxFiles={10} onFilesChange={(files) => setDocumentation({ ...documentation, estatePhotos: files })} existingFiles={documentation.estatePhotos} />
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-8">
            {currentStep > 1 && <Button type="button" variant="outline" onClick={prevStep} className="flex-1"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>}
            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep} className="flex-1">Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Submit Registration</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
