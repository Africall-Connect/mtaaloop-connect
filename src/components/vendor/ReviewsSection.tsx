import { useState } from "react";
import { Star, ThumbsUp, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
}

export const ReviewsSection = ({ rating, reviewCount }: ReviewsSectionProps) => {
  const [sortOrder, setSortOrder] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const reviews = [
    {
      name: "Sarah M.",
      date: "2 days ago",
      rating: 5,
      text: "Best githeri in the estate! Always hot and delivered fast. The mukimo reminds me of my grandmother's cooking. Will order again!",
      helpful: 12,
      verified: true,
    },
    {
      name: "John K.",
      date: "1 week ago",
      rating: 5,
      text: "Food arrived in 7 minutes! Still steaming hot. Portions are generous. The njahe is authentic.",
      helpful: 8,
      verified: true,
    },
  ];

  const ratingDistribution = [
    { stars: 5, percentage: 89 },
    { stars: 4, percentage: 8 },
    { stars: 3, percentage: 2 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 0 },
  ];

  return (
    <Card className="p-4 md:p-6 mb-6 md:mb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">⭐ Customer Reviews ({reviewCount})</h2>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-4 md:mb-6">
        {/* Rating Summary */}
        <div className="space-y-2 md:space-y-3">
          <div className="text-4xl md:text-5xl font-bold text-primary">{rating}</div>
          <div className="text-sm md:text-base text-muted-foreground">out of 5</div>

          {ratingDistribution.map((dist) => (
            <div key={dist.stars} className="flex items-center gap-1.5 md:gap-2">
              <div className="flex gap-0.5 md:gap-1">
                {[...Array(dist.stars)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-warning text-warning" />
                ))}
              </div>
              <div className="flex-1 h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <div className="text-xs md:text-sm text-muted-foreground w-10 md:w-12">{dist.percentage}%</div>
            </div>
          ))}
        </div>

        {/* Sort */}
        <div>
          <Button variant="outline" className="w-full justify-between text-sm md:text-base" onClick={() => { const next = sortOrder === 'recent' ? 'highest' : sortOrder === 'highest' ? 'lowest' : 'recent'; setSortOrder(next); toast.info(`Sorted by ${next === 'recent' ? 'Most Recent' : next === 'highest' ? 'Highest Rating' : 'Lowest Rating'}`); }}>
            Sort: {sortOrder === 'recent' ? 'Most Recent' : sortOrder === 'highest' ? 'Highest Rating' : 'Lowest Rating'}
            <span>▼</span>
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 md:space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="pb-3 md:pb-4 border-b last:border-0">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm md:text-base">{review.name}</span>
                  <span className="text-xs md:text-sm text-muted-foreground">• {review.date}</span>
                </div>
                <div className="flex gap-0.5 md:gap-1 mb-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-warning text-warning" />
                  ))}
                </div>
              </div>
              {review.verified && (
                <Badge variant="secondary" className="text-xs shrink-0">Verified</Badge>
              )}
            </div>

            <p className="text-sm md:text-base text-foreground mb-2 md:mb-3">"{review.text}"</p>

            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm h-8 px-2 md:px-3" onClick={() => toast.success("Marked as helpful")}>
                <ThumbsUp className="w-3 h-3 md:w-4 md:h-4" />
                Helpful ({review.helpful})
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm h-8 px-2 md:px-3" onClick={() => toast.success("Review reported. Thank you for your feedback.")}>
                <Flag className="w-3 h-3 md:w-4 md:h-4" />
                Report
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-3 md:mt-4 text-sm md:text-base" onClick={() => toast.info("All reviews loaded")}>
        Load More Reviews
      </Button>
    </Card>
  );
};
