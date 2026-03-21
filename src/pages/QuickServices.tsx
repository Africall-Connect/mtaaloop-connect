import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Zap, Search, Package, Sparkles, ChefHat, Footprints, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { UsageTracker } from '@/components/subscription/UsageTracker';
import { HowItWorksStrip } from '@/components/services/HowItWorksStrip';
import { WhatsIncludedGrid } from '@/components/services/WhatsIncludedGrid';
import { ErrandRequestForm } from '@/components/services/ErrandRequestForm';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

type ServiceCategory = 'all' | 'cleaning' | 'delivery' | 'cooking' | 'errands';

export default function QuickServices() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');
  const [showErrandForm, setShowErrandForm] = useState(false);
  const errandFormRef = useRef<HTMLDivElement>(null);

  const services: MicroService[] = MICRO_SERVICES_CATALOG.map((s, index) => ({
    ...s,
    id: `service-${index + 1}`,
    created_at: new Date().toISOString(),
  }));

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const priorityService = filteredServices.find(s => s.slug === 'trash-collection');
  const otherServices = filteredServices.filter(s => s.slug !== 'trash-collection');
  const orderedServices = priorityService ? [priorityService, ...otherServices] : otherServices;

  const handleServiceClick = (service: MicroService) => {
    if (service.slug === 'errands') {
      setShowErrandForm(true);
      setTimeout(() => errandFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }
    navigate(`/services/${service.slug}`);
  };

  const handleIncludedClick = (slug: string) => {
    if (slug === 'errands') {
      setShowErrandForm(true);
      setActiveCategory('errands');
      setTimeout(() => errandFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }
    navigate(`/services/${slug}`);
  };

  const handleCategoryChange = (v: string) => {
    setActiveCategory(v as ServiceCategory);
    if (v === 'errands') {
      setShowErrandForm(true);
      setTimeout(() => errandFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-500/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <h1 className="text-xl font-bold">Quick Services</h1>
              </div>
            </div>
            {isSubscribed && <SubscriptionBadge size="sm" />}
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Life's Little Tasks, <span className="text-purple-500">Handled</span>
          </h2>
          <p className="text-muted-foreground">
            From trash collection to meal prep — we've got you covered
          </p>
        </div>

        {/* How It Works */}
        <HowItWorksStrip />

        {/* Subscription */}
        {isSubscribed ? (
          <div className="mb-6"><UsageTracker compact /></div>
        ) : (
          <div className="mb-6"><UpgradePrompt variant="banner" /></div>
        )}

        {/* What's Included */}
        <WhatsIncludedGrid onServiceClick={handleIncludedClick} />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <h3 className="text-lg font-bold mb-3">Book a Service</h3>
        <Tabs defaultValue="all" className="mb-6" onValueChange={handleCategoryChange}>
          <TabsList className="flex w-auto justify-start overflow-x-auto pb-1 scrollbar-hide gap-1">
            <TabsTrigger value="all" className="shrink-0">All</TabsTrigger>
            <TabsTrigger value="delivery" className="shrink-0 gap-1">
              <Package className="w-4 h-4" /> Delivery
            </TabsTrigger>
            <TabsTrigger value="cleaning" className="shrink-0 gap-1">
              <Sparkles className="w-4 h-4" /> Cleaning
            </TabsTrigger>
            <TabsTrigger value="cooking" className="shrink-0 gap-1">
              <ChefHat className="w-4 h-4" /> Cooking
            </TabsTrigger>
            <TabsTrigger value="errands" className="shrink-0 gap-1">
              <Footprints className="w-4 h-4" /> Errands
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Most Popular badge */}
        {activeCategory === 'all' && priorityService && (
          <div className="mb-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <Flame className="w-3 h-3 mr-1" /> Most Popular Service
            </Badge>
          </div>
        )}

        {/* Services Grid */}
        <div className="space-y-4">
          {orderedServices.map((service, index) => (
            <div key={service.id}>
              {index === 1 && activeCategory === 'all' && priorityService && (
                <p className="text-sm text-muted-foreground mb-4 mt-6">Other Services</p>
              )}
              <ServiceCard
                service={service}
                onClick={() => handleServiceClick(service)}
              />
            </div>
          ))}
        </div>

        {orderedServices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No services found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Errand Form */}
        {(showErrandForm || activeCategory === 'errands') && (
          <div ref={errandFormRef} className="mt-8">
            <ErrandRequestForm />
          </div>
        )}

        {/* Plus CTA */}
        {!isSubscribed && (
          <div className="mt-8"><UpgradePrompt /></div>
        )}
      </main>
    </div>
  );
}
