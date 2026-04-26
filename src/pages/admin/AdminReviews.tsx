import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  customer_id: string | null;
  vendor_id: string | null;
  product_id: string | null;
  order_id: string | null;
  rating: number | null;
  comment: string | null;
  is_visible: boolean | null;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5" | "hidden">("all");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ((supabase as any).from("reviews"))
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      // Try order_reviews table as fallback
      const { data: d2 } = await (supabase.from("order_reviews") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      setReviews((d2 as any[]) || []);
    } else {
      setReviews((data as any[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const filtered = reviews.filter(r => {
    if (filter === "all") return true;
    if (filter === "hidden") return r.is_visible === false;
    return r.rating === parseInt(filter);
  });

  const toggleVisibility = async (r: Review) => {
    const { error } = await ((supabase as any).from("reviews"))
      .update({ is_visible: !(r.is_visible !== false) })
      .eq("id", r.id);
    if (error) toast.error("Update failed: " + error.message);
    else {
      toast.success("Review updated");
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await ((supabase as any).from("reviews")).delete().eq("id", id);
    if (error) toast.error("Delete failed: " + error.message);
    else {
      toast.success("Review deleted");
      fetchReviews();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex gap-3">
        <Button variant="outline" onClick={fetchReviews}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all">All ({reviews.length})</TabsTrigger>
          {[5, 4, 3, 2, 1].map(n => (
            <TabsTrigger key={n} value={String(n)}>
              {n} ★ ({reviews.filter(r => r.rating === n).length})
            </TabsTrigger>
          ))}
          <TabsTrigger value="hidden">Hidden ({reviews.filter(r => r.is_visible === false).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3">
        {loading ? (
          <Card><CardContent className="p-8 text-center text-slate-500">Loading...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-slate-500">No reviews found</CardContent></Card>
        ) : (
          filtered.map(r => (
            <Card key={r.id} className={r.is_visible === false ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(r.rating || 0)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      {r.is_visible === false && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                      <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{r.comment || <em className="text-slate-500">No comment</em>}</p>
                    <div className="text-xs text-slate-500 mt-2 font-mono">
                      Customer: {r.customer_id?.slice(0, 8) || "—"} · Vendor: {r.vendor_id?.slice(0, 8) || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleVisibility(r)}>
                      {r.is_visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteReview(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
