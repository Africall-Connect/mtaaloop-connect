import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints, FileText, Key, Mail, Store, Pill, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

export default function ErrandsService() {
  const navigate = useNavigate();

  const serviceData = MICRO_SERVICES_CATALOG.find(s => s.slug === 'errands');
  
  if (!serviceData) {
    return <div>Service not found</div>;
  }

  const service: MicroService = {
    ...serviceData,
    id: 'errands-service',
    created_at: new Date().toISOString(),
  };

  const handleSuccess = (requestId: string) => {
    navigate(`/service-tracking/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-green-500/5 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Footprints className="h-5 w-5 text-green-600" />
            </div>
            <h1 className="text-xl font-bold">Run Errands</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Need something done? Our agents can run various errands for you within the estate.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">Examples of Errands:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" /> Pick up documents/forms
            </li>
            <li className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" /> Key drop-off/pickup
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" /> Post office runs
            </li>
            <li className="flex items-center gap-2">
              <Store className="w-4 h-4 text-muted-foreground" /> Quick store runs
            </li>
            <li className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-muted-foreground" /> Pharmacy pickups
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Pricing Note:
          </h4>
          <p className="text-sm text-amber-700">
            Base price is KSh 100. Additional costs may apply for errands outside the building (KSh 100 extra) or for purchasing items.
          </p>
        </div>

        <ServiceRequestForm service={service} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
