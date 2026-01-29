import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

export default function QuickCleaning() {
  const navigate = useNavigate();

  const serviceData = MICRO_SERVICES_CATALOG.find(s => s.slug === 'quick-cleaning');
  
  if (!serviceData) {
    return <div>Service not found</div>;
  }

  const service: MicroService = {
    ...serviceData,
    id: 'quick-cleaning-service',
    created_at: new Date().toISOString(),
  };

  const handleSuccess = (requestId: string) => {
    navigate(`/service-tracking/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-500/5 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧹</span>
            <h1 className="text-xl font-bold">Quick Cleaning</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            A quick 30-minute tidy-up for your bedroom or sitting room. Perfect for busy days!
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">What's Included:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span>✓</span> Sweeping & mopping floors
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Dusting surfaces
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Making the bed
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> General tidying up
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <span>📍</span> One room only (bedroom OR sitting room)
            </li>
          </ul>
        </div>

        <ServiceRequestForm service={service} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
