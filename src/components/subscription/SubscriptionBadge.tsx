import { Crown, Sparkles, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  showPlanName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const planIcons: Record<string, React.ReactNode> = {
  starter: <Zap className="h-3 w-3" />,
  essential: <Sparkles className="h-3 w-3" />,
  premium: <Star className="h-3 w-3" />,
  ultimate: <Crown className="h-3 w-3" />,
};

const planColors: Record<string, string> = {
  starter: 'bg-blue-100 text-blue-700 border-blue-200',
  essential: 'bg-purple-100 text-purple-700 border-purple-200',
  premium: 'bg-amber-100 text-amber-700 border-amber-200',
  ultimate: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function SubscriptionBadge({ showPlanName = true, size = 'md', className }: SubscriptionBadgeProps) {
  const { isSubscribed, plan } = useSubscription();

  if (!isSubscribed || !plan) {
    return null;
  }

  const planSlug = plan.slug;
  const icon = planIcons[planSlug] || <Crown className="h-3 w-3" />;
  const colors = planColors[planSlug] || 'bg-primary/10 text-primary';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        colors,
        sizeClasses[size],
        className
      )}
    >
      {icon}
      {showPlanName ? (
        <span>Plus {plan.name}</span>
      ) : (
        <span>Plus</span>
      )}
    </Badge>
  );
}
