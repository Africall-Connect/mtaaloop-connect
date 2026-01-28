import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageSquare, Share2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  order_id: string;
  customers: {
    first_name: string | null;
    last_name: string | null;
  };
  orders: {
    order_number: string;
  };
  review_responses: Array<{
    response: string;
  }>;
}

interface RecentReviewsProps {
  vendorId: string;
}

export default function RecentReviews({ vendorId }: RecentReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customers (first_name, last_name),
          orders (order_number),
          review_responses (response)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    try {
      const { error } = await supabase
        .from('review_responses')
        .insert({
          review_id: reviewId,
          vendor_id: vendorId,
          response: replyText
        });

      if (error) throw error;
      toast.success('Reply posted successfully');
      setReplyingTo(null);
      setReplyText('');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const getStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const stats = {
    avgRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    fiveStarPercent: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 5).length / reviews.length) * 100) : 0,
    responseRate: 85
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">Loading reviews...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            ⭐ RECENT REVIEWS
          </CardTitle>
          <Button variant="link" size="sm">
            View All →
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet
          </div>
        ) : (
          reviews.map((review) => {
            const customerName = review.customers?.first_name
              ? `${review.customers.first_name} ${review.customers.last_name || ''}`.trim()
              : 'Customer';
            const hasResponse = review.review_responses && review.review_responses.length > 0;

            return (
              <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStars(review.rating)}</span>
                        <span className="font-medium">{customerName}</span>
                        <span className="text-xs text-gray-500">{getTimeAgo(review.created_at)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Order: {review.orders?.order_number || 'N/A'}
                      </div>
                    </div>
                    {review.rating <= 3 && !hasResponse && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs Attention
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-700">"{review.comment}"</p>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      Helpful (5)
                    </Button>
                    {!hasResponse ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setReplyingTo(review.id)}
                      >
                        <MessageSquare className="h-3 w-3" />
                        Reply
                      </Button>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        ✓ Replied
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                      <Share2 className="h-3 w-3" />
                      Share
                    </Button>
                  </div>

                  {hasResponse && (
                    <div className="bg-blue-50 border-l-2 border-blue-500 pl-3 py-2 ml-4 text-sm">
                      <div className="font-medium text-blue-900">💬 YOUR REPLY:</div>
                      <div className="text-blue-800">"{review.review_responses[0].response}"</div>
                    </div>
                  )}

                  {replyingTo === review.id && (
                    <div className="ml-4 space-y-2">
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitReply(review.id)}>
                          Post Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {reviews.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="font-medium text-gray-900">📊 REVIEW SUMMARY (Last 30 days):</div>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>Average Rating: {stats.avgRating.toFixed(1)} ⭐</div>
              <div>5-star: {stats.fiveStarPercent}%</div>
              <div>Response Rate: {stats.responseRate}%</div>
              <div>Avg Response Time: 2 hours</div>
            </div>
          </div>
        )}

        {reviews.some(r => r.review_responses.length === 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <div className="font-medium text-amber-900">💡 TIP:</div>
            <div className="text-amber-800">
              Responding to reviews can improve customer loyalty by up to 30%. Reply to pending reviews now!
            </div>
            <Button size="sm" className="mt-2">
              Reply to All Pending (2)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
