import { MICRO_SERVICES_CATALOG } from '@/types/subscription';
import { getServiceIcon } from '@/lib/serviceIcons';
import { getServiceImage } from '@/lib/serviceImages';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';

interface WhatsIncludedGridProps {
  onServiceClick: (slug: string) => void;
}

export function WhatsIncludedGrid({ onServiceClick }: WhatsIncludedGridProps) {
  const services = MICRO_SERVICES_CATALOG;
  const errands = services.find(s => s.slug === 'errands');
  const others = services.filter(s => s.slug !== 'errands');

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-3">What's Included</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {others.map((service) => {
          const Icon = getServiceIcon(service.slug);
          const isTrash = service.slug === 'trash-collection';
          return (
            <button
              key={service.slug}
              onClick={() => onServiceClick(service.slug)}
              className="relative group rounded-xl overflow-hidden border bg-card hover:shadow-md transition-all text-left"
            >
              <div className="h-20 overflow-hidden">
                <img
                  src={getServiceImage(service.slug)}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              {isTrash && (
                <Badge className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 gap-0.5">
                  <Flame className="w-3 h-3" /> Popular
                </Badge>
              )}
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold truncate">{service.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{service.description}</p>
                <p className="text-xs font-bold mt-1">KSh {service.base_price}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Errands full-width row */}
      {errands && (
        <button
          onClick={() => onServiceClick('errands')}
          className="w-full group rounded-xl overflow-hidden border bg-card hover:shadow-md transition-all text-left flex"
        >
          <div className="w-24 sm:w-32 shrink-0 overflow-hidden">
            <img
              src={getServiceImage('errands')}
              alt="Run Errands"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-3 flex-1 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold">{errands.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Custom</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{errands.description}</p>
              <p className="text-xs font-bold mt-1">From KSh {errands.base_price}</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
