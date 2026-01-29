import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Check, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

export default function QuickMealPrep() {
  const navigate = useNavigate();

  const serviceData = MICRO_SERVICES_CATALOG.find(s => s.slug === 'quick-meal-prep');
  
  if (!serviceData) {
    return <div>Service not found</div>;
  }

  const service: MicroService = {
    ...serviceData,
    id: 'quick-meal-prep-service',
    created_at: new Date().toISOString(),
  };

  const handleSuccess = (requestId: string) => {
    navigate(`/service-tracking/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-500/5 to-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold">Quick Meal Prep</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            Our agents can help prepare a simple meal for you. Just provide the ingredients!
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">What's Included:</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" /> Simple meal preparation
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" /> Cutting, chopping, cooking
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" /> Clean up after cooking
            </li>
            <li className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" /> You provide the ingredients
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Lightbulb className="w-4 h-4" /> Great for ugali, rice, simple stews
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Before You Book:
          </h4>
          <p className="text-sm text-amber-700">
            Make sure you have all ingredients ready. Our agent will prepare the meal using what you have in your kitchen.
          </p>
        </div>

        <ServiceRequestForm service={service} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
