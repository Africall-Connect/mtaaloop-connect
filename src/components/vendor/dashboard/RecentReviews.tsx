import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  food_rating: number;
  delivery_rating: number;
  comment: string | null;
  created_at: string;
  order_id: string;
}

interface RecentReviewsProps {
  vendorId: string;
}

export default function RecentReviews({ vendorId }: RecentReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      // Use order_reviews table which exists in the schema
      const { data, error } = await supabase
        .from('order_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setReviews((data as any) || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const getStars = (rating: number) => '⭐'.repeat(Math.round(rating));

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="text-center">Loading reviews...</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">⭐ RECENT REVIEWS</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No reviews yet</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStars(review.food_rating)}</span>
                  <span className="text-xs text-muted-foreground">{getTimeAgo(review.created_at)}</span>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">"{review.comment}"</p>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
