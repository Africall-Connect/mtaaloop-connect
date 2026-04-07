import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { toast } from "sonner";

interface CustomerResult {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
}

export default function CSRCustomerLookup() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) {
      toast.info("Enter an email, phone, or name to search");
      return;
    }
    setLoading(true);
    try {
      // Try app_users view first (gives email, name, phone joined from auth.users)
      const q = query.trim().toLowerCase();
      const { data, error } = await (supabase.from("app_users") as any)
        .select("id, email, first_name, last_name, phone")
        .or(`email.ilike.%${q}%,phone.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(50);

      if (error) {
        toast.error("Search failed: " + error.message);
        setResults([]);
      } else {
        const mapped = ((data as any[]) || []).map((u) => ({
          id: u.id,
          email: u.email,
          name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null,
          phone: u.phone,
        }));
        setResults(mapped);
        if (mapped.length === 0) toast.info("No customers found");
      }
    } catch (e: any) {
      toast.error(e?.message || "Search failed");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Customer lookup</h2>
        <p className="text-sm text-slate-500">Search by name, email, or phone number</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="email@example.com, +254..., Jane Doe"
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
        </div>
        <Button onClick={search} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/csr/customers/${c.id}`)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                    {(c.name || c.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name || "Unnamed"}</div>
                    <div className="text-xs text-slate-500 truncate">{c.email}</div>
                    {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                  </div>
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && !loading && query && (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            Press search to find customers
          </CardContent>
        </Card>
      )}
    </div>
  );
}
