import { Link } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Reviews = () => {
  const reviews = [
    {
      id: 1,
      vendor: "Traditional Stews & Preparations",
      item: "Githeri & Yellow Beans",
      rating: 5,
      comment: "Amazing food! Tastes just like home cooking.",
      date: "2 days ago",
    },
    {
      id: 2,
      vendor: "Fresh Produce Market",
      item: "Organic Vegetables Bundle",
      rating: 4,
      comment: "Fresh and delivered on time.",
      date: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">⭐ My Reviews</h1>
        </div>

        <div className="space-y-3 sm:space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {reviews.map((review) => (
            <Card key={review.id} className="p-3 sm:p-4">
              <div className="mb-2 sm:mb-3">
                <h3 className="font-semibold text-sm sm:text-base">{review.vendor}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{review.item}</p>
              </div>
              
              <div className="flex items-center gap-0.5 sm:gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 md:h-5 md:w-5 ${
                      i < review.rating
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs sm:text-sm mb-2">{review.comment}</p>
              <p className="text-xs text-muted-foreground">{review.date}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
