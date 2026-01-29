import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

export default function PackageCollection() {
  const navigate = useNavigate();

  const serviceData = MICRO_SERVICES_CATALOG.find(s => s.slug === 'package-collection');
  
  if (!serviceData) {
    return <div>Service not found</div>;
  }

  const service: MicroService = {
    ...serviceData,
    id: 'package-collection-service',
    created_at: new Date().toISOString(),
  };

  const handleSuccess = (requestId: string) => {
    navigate(`/service-tracking/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-indigo-500/5 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h1 className="text-xl font-bold">Package Collection</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Got a package at the gate? We'll pick it up and bring it right to your door.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">How it Works:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span>1️⃣</span> Your package arrives at the gate
            </li>
            <li className="flex items-center gap-2">
              <span>2️⃣</span> Request pickup through MtaaLoop
            </li>
            <li className="flex items-center gap-2">
              <span>3️⃣</span> Agent collects from reception/gate
            </li>
            <li className="flex items-center gap-2">
              <span>4️⃣</span> Delivered to your doorstep
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-800 mb-2">Tip:</h4>
          <p className="text-sm text-blue-700">
            Include your package description and where to collect it from (gate, reception, etc.) in the notes.
          </p>
        </div>

        <ServiceRequestForm service={service} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
