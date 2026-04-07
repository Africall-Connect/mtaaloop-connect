import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Check, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface CannedResponse {
  id: string;
  category: string;
  title: string;
  body: string;
  shortcut: string | null;
  is_active: boolean;
  use_count: number;
}

export default function CSRCannedResponses() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("csr_canned_responses") as any)
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });
    if (error) {
      toast.error("Failed to load: " + error.message);
    } else {
      setResponses((data as CannedResponse[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const filtered = responses.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.shortcut || "").toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, CannedResponse[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const copyResponse = async (r: CannedResponse) => {
    try {
      await navigator.clipboard.writeText(r.body);
      setCopiedId(r.id);
      toast.success("Copied to clipboard");
      // Increment use count (best effort)
      await (supabase.from("csr_canned_responses") as any)
        .update({ use_count: r.use_count + 1 })
        .eq("id", r.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Canned responses</h2>
        <p className="text-sm text-slate-500">Quick replies you can copy into chats</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by title, content, category, or shortcut..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-slate-500">Loading...</CardContent></Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No responses found</h3>
            <p className="text-sm text-slate-500">Ask an admin to seed the canned responses table.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">{category}</h3>
            <div className="grid gap-2">
              {items.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{r.title}</span>
                          {r.shortcut && (
                            <Badge variant="outline" className="text-[10px] font-mono">{r.shortcut}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{r.body}</div>
                        {r.use_count > 0 && (
                          <div className="text-[10px] text-slate-400 mt-2">Used {r.use_count} times</div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => copyResponse(r)}>
                        {copiedId === r.id ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                        {copiedId === r.id ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
