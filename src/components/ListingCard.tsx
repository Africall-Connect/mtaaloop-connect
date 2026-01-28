import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Listing } from '@/lib/mockData';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link to={`/listing/${listing.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge
            className={`absolute top-3 left-3 ${
              listing.type === 'product'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {listing.type === 'product' ? 'Product' : 'Service'}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Add to favorites
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
          {listing.isFeatured && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Featured
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </Link>

        <p className="mt-1 text-lg font-bold text-primary">
          {formatPrice(listing.price, listing.currency)}
          {listing.type === 'service' && (
            <span className="text-sm font-normal text-muted-foreground"> /session</span>
          )}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={listing.sellerAvatar}
              alt={listing.sellerName}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm text-muted-foreground line-clamp-1">
              {listing.sellerName}
            </span>
            {listing.isVerified && (
              <BadgeCheck className="h-4 w-4 text-secondary" />
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
