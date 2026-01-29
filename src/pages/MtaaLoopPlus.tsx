import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';
import { UsageTracker } from '@/components/subscription/UsageTracker';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { toast } from 'sonner';

export default function MtaaLoopPlus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, plan, expiresAt } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planSlug: string) => {
    if (!user) {
      toast.error('Please login to subscribe');
      navigate('/auth/login');
      return;
    }

    setSelectedPlan(planSlug);
    const plan = SUBSCRIPTION_PLANS.find(p => p.slug === planSlug);
    
    // For now, show toast - payment integration would go here
    toast.info(`Selected ${plan?.name} plan - KSh ${plan?.price}/month. Payment integration coming soon!`);
  };

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Save Time',
      description: 'Let our agents handle your daily chores'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Trusted Agents',
      description: 'Verified and trained delivery agents'
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Premium Perks',
      description: 'Cashback, priority support & scheduling'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Building Community',
      description: 'Join thousands of happy subscribers'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">MtaaLoop Plus</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-gradient-to-r from-primary to-purple-500 text-white">
            Premium Membership
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Life, <span className="text-primary">Simplified</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get unlimited deliveries, trash collection, home cleaning, and more. 
            Save time and money with MtaaLoop Plus.
          </p>
        </div>

        {/* Current Subscription Status */}
        {isSubscribed && plan && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">You're a Plus Member!</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.name} Plan • Renews {expiresAt?.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/account/wallet')}>
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3 mx-auto">
                <div className="text-primary">{benefit.icon}</div>
              </div>
              <h3 className="font-medium mb-1">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>

        {/* Tabs: Plans vs Usage */}
        <Tabs defaultValue="plans" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="plans">Choose Plan</TabsTrigger>
            <TabsTrigger value="usage" disabled={!isSubscribed}>My Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-6">
            {/* Subscription Plans */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUBSCRIPTION_PLANS.map((planData, index) => (
                <SubscriptionCard
                  key={planData.slug}
                  plan={planData}
                  isCurrentPlan={plan?.slug === planData.slug}
                  isPopular={index === 2} // Premium is most popular
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <UsageTracker showAll />
            </div>
          </TabsContent>
        </Tabs>

        {/* What's Included Section */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <h3 className="text-xl font-bold mb-4 text-center">What's Included</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '🗑️', name: 'Trash Collection', desc: 'Doorstep pickup' },
                { icon: '🚚', name: 'Free Deliveries', desc: 'Within your building' },
                { icon: '🧽', name: 'Osha Viombo', desc: 'Dish washing service' },
                { icon: '🧹', name: 'Quick Cleaning', desc: '30-min room tidy' },
                { icon: '👕', name: 'Laundry Sorting', desc: 'Fold & organize' },
                { icon: '🍳', name: 'Meal Prep', desc: 'Simple cooking help' },
                { icon: '🏃', name: 'Errands', desc: 'General tasks' },
                { icon: '📦', name: 'Package Collection', desc: 'Gate pickup' },
                { icon: '💰', name: 'Cashback', desc: 'Up to 12% back' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardContent className="py-6">
            <h3 className="text-xl font-bold mb-4 text-center">Frequently Asked Questions</h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes! You can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
                },
                {
                  q: 'How do I use my subscription benefits?',
                  a: 'Simply request any included service through the Quick Services page. If you have remaining quota, the service will be free!'
                },
                {
                  q: 'What happens to unused services?',
                  a: 'Unused services do not roll over to the next month. Each billing period starts fresh.'
                },
                {
                  q: 'Can I upgrade my plan mid-month?',
                  a: 'Yes! When you upgrade, you\'ll get immediate access to the higher tier benefits. The price difference will be prorated.'
                },
              ].map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <h4 className="font-medium mb-2">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
