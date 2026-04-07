import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RefreshCw, Plus, Minus, Wallet } from "lucide-react";
import { toast } from "sonner";

interface WalletRow {
  id: string;
  user_id?: string | null;
  rider_id?: string | null;
  balance: number | null;
  updated_at: string | null;
  created_at: string | null;
}

type ActionType = "credit" | "debit";

export default function AdminWallets() {
  const [customerWallets, setCustomerWallets] = useState<WalletRow[]>([]);
  const [riderWallets, setRiderWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ wallet: WalletRow; kind: "customer" | "rider" } | null>(null);
  const [action, setAction] = useState<ActionType>("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    const [c, r] = await Promise.all([
      (supabase.from("customer_wallet") as any).select("*").order("updated_at", { ascending: false }).limit(500),
      (supabase.from("rider_wallet") as any).select("*").order("updated_at", { ascending: false }).limit(500),
    ]);
    setCustomerWallets((c.data as any[]) || []);
    setRiderWallets((r.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  const openAction = (wallet: WalletRow, kind: "customer" | "rider", act: ActionType) => {
    setSelected({ wallet, kind });
    setAction(act);
    setAmount("");
    setReason("");
  };

  const submitAction = async () => {
    if (!selected) return;
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const { wallet, kind } = selected;
    const delta = action === "credit" ? n : -n;
    const newBalance = Number(wallet.balance || 0) + delta;

    if (newBalance < 0) {
      toast.error("Insufficient balance for debit");
      return;
    }

    // Update balance
    const walletTable = kind === "customer" ? "customer_wallet" : "rider_wallet";
    const txTable = kind === "customer" ? "customer_wallet_tx" : "rider_wallet_tx";
    const userIdField = kind === "customer" ? "user_id" : "rider_id";
    const userId = kind === "customer" ? wallet.user_id : wallet.rider_id;

    const { error: updateErr } = await (supabase.from(walletTable) as any)
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    if (updateErr) {
      toast.error("Balance update failed: " + updateErr.message);
      return;
    }

    // Log transaction
    const { error: txErr } = await (supabase.from(txTable) as any).insert({
      [userIdField]: userId,
      amount: n,
      type: action,
      description: reason || `Admin ${action}`,
    });

    if (txErr) {
      toast.error("Transaction log failed: " + txErr.message);
    } else {
      toast.success(`${action === "credit" ? "Credited" : "Debited"} KSh ${n.toLocaleString()}`);
    }

    setSelected(null);
    fetchWallets();
  };

  const renderTable = (wallets: WalletRow[], kind: "customer" | "rider") => (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : wallets.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No wallets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-4 py-3">User ID</th>
                  <th className="text-right px-4 py-3">Balance</th>
                  <th className="text-left px-4 py-3">Last updated</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(w => (
                  <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-mono text-xs">{(kind === "customer" ? w.user_id : w.rider_id)?.slice(0, 12) || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">KSh {Number(w.balance || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{w.updated_at ? new Date(w.updated_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openAction(w, kind, "credit")}>
                        <Plus className="h-3 w-3 mr-1" /> Credit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openAction(w, kind, "debit")}>
                        <Minus className="h-3 w-3 mr-1" /> Debit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={fetchWallets}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Badge variant="outline" className="gap-1"><Wallet className="h-3 w-3" /> Total Customer: KSh {customerWallets.reduce((s, w) => s + Number(w.balance || 0), 0).toLocaleString()}</Badge>
          <Badge variant="outline" className="gap-1"><Wallet className="h-3 w-3" /> Total Rider: KSh {riderWallets.reduce((s, w) => s + Number(w.balance || 0), 0).toLocaleString()}</Badge>
        </div>
      </div>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">Customer Wallets ({customerWallets.length})</TabsTrigger>
          <TabsTrigger value="rider">Rider Wallets ({riderWallets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="customer" className="mt-4">
          {renderTable(customerWallets, "customer")}
        </TabsContent>
        <TabsContent value="rider" className="mt-4">
          {renderTable(riderWallets, "rider")}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "credit" ? "Credit" : "Debit"} Wallet
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Current balance: <span className="font-semibold">KSh {Number(selected.wallet.balance || 0).toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <Label>Amount (KSh)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Refund for order #1234" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={submitAction}>Confirm {action}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
