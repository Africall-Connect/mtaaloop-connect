import { Star, ThumbsUp, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
}

export const ReviewsSection = ({ rating, reviewCount }: ReviewsSectionProps) => {
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
    <Card className="p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">⭐ Customer Reviews ({reviewCount})</h2>

      <div className="grid md:grid-cols-2 gap-8 mb-6">
        {/* Rating Summary */}
        <div className="space-y-3">
          <div className="text-5xl font-bold text-primary">{rating}</div>
          <div className="text-muted-foreground">out of 5</div>

          {ratingDistribution.map((dist) => (
            <div key={dist.stars} className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(dist.stars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning"
                  style={{ width: `${dist.percentage}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground w-12">{dist.percentage}%</div>
            </div>
          ))}
        </div>

        {/* Sort */}
        <div>
          <Button variant="outline" className="w-full justify-between">
            Sort: Most Recent
            <span>▼</span>
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="pb-4 border-b last:border-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{review.name}</span>
                  <span className="text-sm text-muted-foreground">• {review.date}</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
              </div>
              {review.verified && (
                <Badge variant="secondary">Verified Purchase</Badge>
              )}
            </div>

            <p className="text-foreground mb-3">"{review.text}"</p>

            <div className="flex items-center gap-4 text-sm">
              <Button variant="ghost" size="sm" className="gap-2">
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpful})
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Flag className="w-4 h-4" />
                Report
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4">
        Load More Reviews
      </Button>
    </Card>
  );
};
