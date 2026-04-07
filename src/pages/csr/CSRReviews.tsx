import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Send, AlertTriangle, MessageSquare, RefreshCw, Ticket } from "lucide-react";
import { toast } from "sonner";
import { findOrCreateChatWithCustomer } from "@/lib/csrChat";

interface DeliveredOrder {
  id: string;
  order_number: string | null;
  customer_id: string | null;
  full_name: string | null;
  total_amount: number | null;
  delivered_at?: string | null;
  created_at: string;
}

interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  food_rating: number | null;
  delivery_rating: number | null;
  comment: string | null;
  created_at: string;
}

export default function CSRReviews() {
  const { user } = useAuth();
  const [tab, setTab] = useState("unreviewed");
  const [unreviewed, setUnreviewed] = useState<DeliveredOrder[]>([]);
  const [lowRated, setLowRated] = useState<Review[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Delivered orders without a review
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, full_name, total_amount, created_at")
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(200);

      const orderIds = (deliveredOrders as any[])?.map(o => o.id) || [];
      let reviewedOrderIds = new Set<string>();
      if (orderIds.length > 0) {
        const { data: existingReviews } = await (supabase.from("order_reviews") as any)
          .select("order_id")
          .in("order_id", orderIds);
        reviewedOrderIds = new Set(((existingReviews as any[]) || []).map(r => r.order_id));
      }
      setUnreviewed(((deliveredOrders as any[]) || []).filter(o => !reviewedOrderIds.has(o.id)).slice(0, 100));

      // 2. Low rated reviews
      const { data: low } = await (supabase.from("order_reviews") as any)
        .select("*")
        .or("food_rating.lte.2,delivery_rating.lte.2")
        .order("created_at", { ascending: false })
        .limit(100);
      setLowRated((low as Review[]) || []);

      // 3. Recent reviews
      const { data: recent } = await (supabase.from("order_reviews") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setRecentReviews((recent as Review[]) || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load reviews");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sendReviewPrompt = async (order: DeliveredOrder) => {
    if (!user || !order.customer_id) return;
    setBusyId(order.id);
    try {
      // Insert review_prompts row
      const { error: promptError } = await (supabase.from("review_prompts") as any).insert({
        order_id: order.id,
        customer_id: order.customer_id,
        sent_by: user.id,
        prompt_type: "csr",
      });
      if (promptError) throw promptError;

      // Insert notification for customer (popup + sound via NotificationProvider)
      // NOTE: related_id intentionally omitted — schema cache may not have it on all envs
      const { error: notifError } = await (supabase.from("notifications") as any).insert({
        user_id: order.customer_id,
        title: "How was your order? ⭐",
        message: `Order #${order.order_number || order.id.slice(0, 8)} — please leave a quick review!`,
        type: "review",
      });
      if (notifError) throw notifError;

      toast.success("Review prompt sent");
      // Optimistically remove
      setUnreviewed(prev => prev.filter(o => o.id !== order.id));
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
    setBusyId(null);
  };

  const openTicketForLowRating = async (review: Review) => {
    if (!user) return;
    setBusyId(review.id);
    try {
      const { error } = await (supabase.from("support_tickets") as any).insert({
        customer_id: review.customer_id,
        order_id: review.order_id,
        subject: `Low rating: ${review.food_rating ?? "?"}/5 food, ${review.delivery_rating ?? "?"}/5 delivery`,
        description: review.comment || "Customer left a low rating with no comment",
        category: "product_quality",
        severity: (review.food_rating ?? 5) === 1 ? "urgent" : "high",
        status: "open",
      });
      if (error) throw error;
      toast.success("Ticket created");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
    setBusyId(null);
  };

  const startChat = async (customerId: string) => {
    if (!user) return;
    setBusyId(customerId);
    try {
      const chatId = await findOrCreateChatWithCustomer(user.id, customerId);
      window.location.href = `/csr/inbox?chat=${chatId}`;
    } catch (e: any) {
      toast.error("Failed: " + (e?.message || "Unknown error"));
    }
    setBusyId(null);
  };

  const ratingColor = (r: number | null) => {
    if (!r) return "text-slate-400";
    if (r <= 2) return "text-red-600";
    if (r === 3) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reviews & feedback</h2>
          <p className="text-sm text-slate-500">Send review prompts and triage low ratings</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unreviewed">Unreviewed ({unreviewed.length})</TabsTrigger>
          <TabsTrigger value="low_rated">Low ratings ({lowRated.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent reviews ({recentReviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unreviewed" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : unreviewed.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No unreviewed orders</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {unreviewed.map(o => (
                    <div key={o.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-slate-500">{o.order_number || o.id.slice(0, 8)}</div>
                        <div className="text-sm font-medium truncate">{o.full_name || "—"}</div>
                        <div className="text-xs text-slate-500">
                          KSh {Number(o.total_amount || 0).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendReviewPrompt(o)}
                        disabled={busyId === o.id}
                      >
                        <Send className="h-3 w-3 mr-2" /> Send prompt
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low_rated" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : lowRated.length === 0 ? (
                <div className="p-8 text-center text-slate-500">🎉 No low ratings to triage</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowRated.map(r => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <div className="flex items-center gap-2 text-sm">
                            <span className={ratingColor(r.food_rating)}>Food {r.food_rating}/5</span>
                            <span className="text-slate-400">·</span>
                            <span className={ratingColor(r.delivery_rating)}>Delivery {r.delivery_rating}/5</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {r.comment && (
                        <div className="text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded mb-2">{r.comment}</div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openTicketForLowRating(r)} disabled={busyId === r.id}>
                          <Ticket className="h-3 w-3 mr-2" /> Open ticket
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startChat(r.customer_id)} disabled={busyId === r.customer_id}>
                          <MessageSquare className="h-3 w-3 mr-2" /> Open chat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : recentReviews.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No reviews yet</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentReviews.map(r => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        {[...Array(Math.max(r.food_rating || 0, r.delivery_rating || 0))].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xs text-slate-400 ml-2">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm">{r.comment}</p>}
                      <div className="flex gap-2 mt-2 text-[10px] text-slate-500">
                        <Badge variant="outline" className="text-[10px]">Food {r.food_rating ?? "—"}/5</Badge>
                        <Badge variant="outline" className="text-[10px]">Delivery {r.delivery_rating ?? "—"}/5</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
