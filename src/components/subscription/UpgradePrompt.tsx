import { Crown, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UpgradePromptProps {
  service?: string;
  variant?: 'card' | 'banner' | 'inline';
  onDismiss?: () => void;
}

export function UpgradePrompt({ service, variant = 'card', onDismiss }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { isSubscribed, plan } = useSubscription();

  // Don't show if already on Ultimate plan
  if (isSubscribed && plan?.slug === 'ultimate') {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/mtaaloop-plus');
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {isSubscribed ? 'Upgrade your plan' : 'Get MtaaLoop Plus'}
              </p>
              <p className="text-sm text-muted-foreground">
                {service 
                  ? `Include ${service} in your subscription`
                  : 'Unlock unlimited deliveries & services'}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleUpgrade}>
            {isSubscribed ? 'Upgrade' : 'Subscribe'}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-muted-foreground">
          {service ? `${service} included in ` : 'Included in '}
        </span>
        <button 
          onClick={handleUpgrade}
          className="font-medium text-primary hover:underline"
        >
          MtaaLoop Plus
        </button>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-primary to-purple-500 rounded-xl text-white">
            <Crown className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {isSubscribed ? 'Upgrade to unlock more' : 'Join MtaaLoop Plus'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {service 
                ? `Get ${service} included with your subscription`
                : 'Save up to 60% on deliveries and home services'}
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Free deliveries</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Trash collection</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Home cleaning</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Up to 12% cashback</span>
              </div>
            </div>

            <Button onClick={handleUpgrade} className="w-full">
              {isSubscribed ? 'Upgrade Plan' : 'View Plans'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
