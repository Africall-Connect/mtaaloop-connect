import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UsageType } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface UsageTrackerProps {
  showAll?: boolean;
  compact?: boolean;
}

const usageLabels: Record<UsageType, { label: string; icon: string }> = {
  delivery: { label: 'Deliveries', icon: '🚚' },
  trash: { label: 'Trash Pickups', icon: '🗑️' },
  osha_viombo: { label: 'Osha Viombo', icon: '🧽' },
  cleaning: { label: 'Quick Cleaning', icon: '🧹' },
  laundry: { label: 'Laundry Sorting', icon: '👕' },
  meal_prep: { label: 'Meal Prep', icon: '🍳' },
  errand: { label: 'Errands', icon: '🏃' },
  package_collection: { label: 'Package Collection', icon: '📦' },
};

export function UsageTracker({ showAll = false, compact = false }: UsageTrackerProps) {
  const { isSubscribed, usage, plan, expiresAt } = useSubscription();

  if (!isSubscribed) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <p>Subscribe to MtaaLoop Plus to track your usage</p>
        </CardContent>
      </Card>
    );
  }

  // Filter to only show services with usage/limits
  const activeServices = Object.entries(usage).filter(([_, status]) => {
    if (showAll) return true;
    return status.limit !== null && status.limit > 0;
  });

  const daysRemaining = expiresAt 
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact grid view for mobile */}
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          {activeServices.slice(0, 4).map(([type, status]) => {
            const info = usageLabels[type as UsageType];
            const isUnlimited = status.limit === null;
            
            return (
              <div key={type} className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xl mb-1">{info.icon}</span>
                <span className="text-xs text-muted-foreground">
                  {isUnlimited ? '∞' : `${status.used}/${status.limit}`}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* List view for larger screens */}
        <div className="hidden sm:block space-y-3">
          {activeServices.slice(0, 4).map(([type, status]) => {
            const info = usageLabels[type as UsageType];
            const isUnlimited = status.limit === null;
            
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="text-lg">{info.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span>{info.label}</span>
                    <span className="text-muted-foreground">
                      {isUnlimited ? '∞' : `${status.used}/${status.limit}`}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <Progress 
                      value={status.percentUsed} 
                      className="h-1.5 mt-1"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* See all link */}
        {activeServices.length > 4 && (
          <p className="text-xs text-center text-primary cursor-pointer hover:underline">
            See all {activeServices.length} services →
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monthly Usage</CardTitle>
          <Badge variant="outline">
            {daysRemaining} days left
          </Badge>
        </div>
        {plan && (
          <p className="text-sm text-muted-foreground">
            {plan.name} Plan
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {activeServices.map(([type, status]) => {
          const info = usageLabels[type as UsageType];
          const isUnlimited = status.limit === null;
          const isLow = !isUnlimited && status.remaining !== 'unlimited' && status.remaining <= 2;
          
          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-medium">{info.label}</span>
                </div>
                <div className="text-right">
                  {isUnlimited ? (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Unlimited
                    </Badge>
                  ) : (
                    <span className={cn(
                      "text-sm",
                      isLow && "text-amber-600 font-medium"
                    )}>
                      {status.used} / {status.limit} used
                    </span>
                  )}
                </div>
              </div>
              {!isUnlimited && (
                <Progress 
                  value={status.percentUsed} 
                  className={cn(
                    "h-2",
                    status.percentUsed >= 90 && "[&>div]:bg-red-500",
                    status.percentUsed >= 75 && status.percentUsed < 90 && "[&>div]:bg-amber-500"
                  )}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
