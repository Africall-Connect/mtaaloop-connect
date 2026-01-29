import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Zap, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SubscriptionBadge } from '@/components/subscription/SubscriptionBadge';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { UsageTracker } from '@/components/subscription/UsageTracker';
import { MICRO_SERVICES_CATALOG, MicroService } from '@/types/subscription';

type ServiceCategory = 'all' | 'cleaning' | 'delivery' | 'cooking' | 'errands';

export default function QuickServices() {
  const navigate = useNavigate();
  const { isSubscribed } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');

  // Convert catalog to full MicroService objects with mock IDs
  const services: MicroService[] = MICRO_SERVICES_CATALOG.map((s, index) => ({
    ...s,
    id: `service-${index + 1}`,
    created_at: new Date().toISOString(),
  }));

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Priority services (trash first)
  const priorityService = filteredServices.find(s => s.slug === 'trash-collection');
  const otherServices = filteredServices.filter(s => s.slug !== 'trash-collection');
  const orderedServices = priorityService ? [priorityService, ...otherServices] : otherServices;

  const handleServiceClick = (service: MicroService) => {
    // Navigate to specific service page
    navigate(`/services/${service.slug}`);
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
        {/* Hero Section */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Life's Little Tasks, <span className="text-purple-500">Handled</span>
          </h2>
          <p className="text-muted-foreground">
            From trash collection to meal prep - we've got you covered
          </p>
        </div>

        {/* Subscription Prompt or Usage */}
        {isSubscribed ? (
          <div className="mb-6">
            <UsageTracker compact />
          </div>
        ) : (
          <div className="mb-6">
            <UpgradePrompt variant="banner" />
          </div>
        )}

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
        <Tabs 
          defaultValue="all" 
          className="mb-6"
          onValueChange={(v) => setActiveCategory(v as ServiceCategory)}
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="delivery">
              <span className="mr-1">📦</span> Delivery
            </TabsTrigger>
            <TabsTrigger value="cleaning">
              <span className="mr-1">🧹</span> Cleaning
            </TabsTrigger>
            <TabsTrigger value="cooking">
              <span className="mr-1">🍳</span> Cooking
            </TabsTrigger>
            <TabsTrigger value="errands">
              <span className="mr-1">🏃</span> Errands
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Priority Badge for Trash */}
        {activeCategory === 'all' && priorityService && (
          <div className="mb-4">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              🔥 Most Popular Service
            </Badge>
          </div>
        )}

        {/* Services Grid */}
        <div className="space-y-4">
          {orderedServices.map((service, index) => (
            <div key={service.id}>
              {/* Show "Other Services" separator after trash */}
              {index === 1 && activeCategory === 'all' && priorityService && (
                <p className="text-sm text-muted-foreground mb-4 mt-6">
                  Other Services
                </p>
              )}
              <ServiceCard
                service={service}
                onClick={() => handleServiceClick(service)}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {orderedServices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No services found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Plus CTA */}
        {!isSubscribed && (
          <div className="mt-8">
            <UpgradePrompt />
          </div>
        )}
      </main>
    </div>
  );
}
