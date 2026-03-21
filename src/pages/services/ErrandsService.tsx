import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrandRequestForm } from '@/components/services/ErrandRequestForm';
import { HowItWorksStrip } from '@/components/services/HowItWorksStrip';

export default function ErrandsService() {
  const navigate = useNavigate();

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
            Need something done? Our agents can run various errands for you.
          </p>
        </div>

        <HowItWorksStrip />
        <ErrandRequestForm />
      </main>
    </div>
  );
}
