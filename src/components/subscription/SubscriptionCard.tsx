import { Check, X, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface SubscriptionCardProps {
  plan: typeof SUBSCRIPTION_PLANS[number];
  isCurrentPlan?: boolean;
  onSelect: (planSlug: string) => void;
  isPopular?: boolean;
}

const planIcons: Record<string, React.ReactNode> = {
  starter: <Zap className="h-6 w-6" />,
  essential: <Sparkles className="h-6 w-6" />,
  premium: <Star className="h-6 w-6" />,
  ultimate: <Crown className="h-6 w-6" />,
};

const planColors: Record<string, string> = {
  starter: 'from-blue-500 to-cyan-500',
  essential: 'from-purple-500 to-pink-500',
  premium: 'from-amber-500 to-orange-500',
  ultimate: 'from-emerald-500 to-teal-500',
};

export function SubscriptionCard({ plan, isCurrentPlan, onSelect, isPopular }: SubscriptionCardProps) {
  const features = plan.features;
  const gradient = planColors[plan.slug] || 'from-primary to-primary/80';

  const formatLimit = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    if (value === 0) return '—';
    return value.toString();
  };

  const isUnlimited = (value: number | null | undefined): boolean => {
    return value === null;
  };

  const featureList = [
    {
      label: 'Deliveries',
      value: features.deliveries,
      icon: '🚚',
    },
    {
      label: 'Trash Pickups',
      value: features.trash,
      icon: '🗑️',
    },
    {
      label: 'Osha Viombo',
      value: features.osha_viombo,
      icon: '🧽',
    },
    {
      label: 'Quick Cleaning',
      value: features.cleaning,
      icon: '🧹',
    },
    {
      label: 'Laundry Sort',
      value: features.laundry,
      icon: '👕',
    },
    {
      label: 'Meal Prep',
      value: features.meal_prep,
      icon: '🍳',
    },
    {
      label: 'Errands',
      value: features.errands,
      icon: '🏃',
    },
  ];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isCurrentPlan && "ring-2 ring-primary",
        isPopular && "scale-105 shadow-xl"
      )}
    >
      {isPopular && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-500 to-orange-500">
            Most Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute top-0 left-0">
          <Badge className="rounded-none rounded-br-lg bg-primary">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className={cn("bg-gradient-to-r text-white", gradient)}>
        <div className="flex items-center gap-3">
          {planIcons[plan.slug]}
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription className="text-white/80">
              MtaaLoop Plus
            </CardDescription>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-4xl font-bold">KSh {plan.price.toLocaleString()}</span>
          <span className="text-white/80">/month</span>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Cashback Badge */}
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {features.cashback_percent}% Cashback
          </Badge>
        </div>

        {/* Feature List */}
        <div className="space-y-3">
          {featureList.map((feature) => (
            <div key={feature.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{feature.icon}</span>
                <span className="text-sm">{feature.label}</span>
              </div>
              <div className="flex items-center">
                {feature.value === null ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Unlimited
                  </Badge>
                ) : feature.value === undefined || feature.value === 0 ? (
                  <X className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <span className="font-medium">{feature.value}/mo</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center gap-2">
            {features.priority_support ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn("text-sm", !features.priority_support && "text-muted-foreground")}>
              Priority Support
            </span>
          </div>
          <div className="flex items-center gap-2">
            {features.agent_scheduling ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn("text-sm", !features.agent_scheduling && "text-muted-foreground")}>
              Agent Scheduling
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className={cn("w-full", isCurrentPlan && "bg-muted text-muted-foreground")}
          disabled={isCurrentPlan}
          onClick={() => onSelect(plan.slug)}
        >
          {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
