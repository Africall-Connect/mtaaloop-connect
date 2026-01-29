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
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-4xl">{service.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base">{service.name}</h3>
              {canUseForFree && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  Included
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                {/* Price */}
                <div className="flex items-baseline gap-1">
                  {canUseForFree ? (
                    <>
                      <span className="text-lg font-bold text-emerald-600">Free</span>
                      <span className="text-xs text-muted-foreground line-through">
                        KSh {service.base_price}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">KSh {service.base_price}</span>
                    </>
                  )}
                </div>

                {/* Time estimate */}
                {service.estimated_time && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{service.estimated_time}</span>
                  </div>
                )}
              </div>

              {/* Remaining uses for subscribers */}
              {isSubscribed && remaining !== 0 && (
                <span className="text-xs text-muted-foreground">
                  {remaining === 'unlimited' ? '∞' : `${remaining} left`}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
