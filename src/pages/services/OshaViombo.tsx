import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

export default function OshaViombo() {
  const navigate = useNavigate();

  // Get service from catalog
  const serviceData = MICRO_SERVICES_CATALOG.find(s => s.slug === 'osha-viombo');
  
  if (!serviceData) {
    return <div>Service not found</div>;
  }

  const service: MicroService = {
    ...serviceData,
    id: 'osha-viombo-service',
    created_at: new Date().toISOString(),
  };

  const handleSuccess = (requestId: string) => {
    navigate(`/service-tracking/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-500/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold">Osha Viombo</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto">
        {/* Service Info */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Our agents will wash your dishes (up to 15 items) and leave your kitchen spotless.
          </p>
        </div>

        {/* What's Included */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">What's Included:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" /> Up to 15 dishes, pots & pans
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" /> Cleaning of sink area
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" /> Drying and organizing
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Lightbulb className="w-4 h-4" /> We bring our own cleaning supplies
            </li>
          </ul>
        </div>

        <ServiceRequestForm service={service} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
