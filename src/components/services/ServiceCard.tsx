import { Clock, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MicroService, UsageType } from '@/types/subscription';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: MicroService;
  onClick?: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const navigate = useNavigate();
  const { isSubscribed, checkCanUseService, getRemainingUsage } = useSubscription();

  const canUseForFree = isSubscribed && checkCanUseService(service.subscription_key);
  const remaining = isSubscribed ? getRemainingUsage(service.subscription_key) : 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/services/${service.slug}`);
    }
  };

  const effectivePrice = canUseForFree ? 0 : service.base_price;

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        canUseForFree && "ring-1 ring-emerald-500/30 bg-emerald-50/30"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          <div className="text-3xl sm:text-4xl shrink-0">{service.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row with title and badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{service.name}</h3>
              {canUseForFree && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs shrink-0 px-1.5 py-0.5">
                  <Check className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Included</span>
                </Badge>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </p>

            {/* Price and meta row */}
            <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Price */}
                <div className="flex items-baseline gap-1">
                  {canUseForFree ? (
                    <>
                      <span className="text-base sm:text-lg font-bold text-emerald-600">Free</span>
                      <span className="text-xs text-muted-foreground line-through">
                        KSh {service.base_price}
                      </span>
                    </>
                  ) : (
                    <span className="text-base sm:text-lg font-bold">KSh {service.base_price}</span>
                  )}
                </div>

                {/* Separator */}
                <span className="text-muted-foreground/50 hidden sm:inline">•</span>

                {/* Time estimate */}
                {service.estimated_time && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{service.estimated_time}</span>
                  </div>
                )}

                {/* Remaining uses for subscribers */}
                {isSubscribed && remaining !== 0 && (
                  <>
                    <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                    <span className="text-xs text-muted-foreground">
                      {remaining === 'unlimited' ? '∞' : `${remaining} left`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
