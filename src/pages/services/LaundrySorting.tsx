import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

export default function LaundrySorting() {
  const navigate = useNavigate();

  const serviceData = MICRO_SERVICES_CATALOG.find(s => s.slug === 'laundry-sorting');
  
  if (!serviceData) {
    return <div>Service not found</div>;
  }

  const service: MicroService = {
    ...serviceData,
    id: 'laundry-sorting-service',
    created_at: new Date().toISOString(),
  };

  const handleSuccess = (requestId: string) => {
    navigate(`/service-tracking/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-500/5 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👕</span>
            <h1 className="text-xl font-bold">Laundry Sorting</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            We'll sort, fold, and organize your clean clothes. No more laundry pile chaos!
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">What's Included:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span>✓</span> Sort clothes by type
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Fold all items neatly
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Organize in your wardrobe/drawers
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Pair socks & organize accessories
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span>📍</span> Clean clothes only (not washing)
            </li>
          </ul>
        </div>

        <ServiceRequestForm service={service} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
