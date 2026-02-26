import { Clock, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { MicroService, UsageType } from '@/types/subscription';
import { cn } from '@/lib/utils';
import { getServiceIcon } from '@/lib/serviceIcons';
import { getServiceImage } from '@/lib/serviceImages';

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
  const IconComponent = getServiceIcon(service.slug);

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden",
        canUseForFree && "ring-1 ring-emerald-500/30 bg-emerald-50/30"
      )}
      onClick={handleClick}
    >
      {/* Service Image Banner */}
      <div className="relative h-28 sm:h-36 overflow-hidden">
        <img 
          src={getServiceImage(service.slug)} 
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-white drop-shadow-md">{service.name}</h3>
        </div>
        {canUseForFree && (
          <Badge className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5">
            <Check className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Included</span>
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">

          {/* Content */}
          <div className="flex-1 min-w-0">
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
