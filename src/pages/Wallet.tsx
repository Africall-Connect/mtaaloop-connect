import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, ArrowDown, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getWalletBalance, getWalletTransactions, creditWallet, type WalletTransaction } from "@/lib/customerWallet";
import { toast } from "sonner";
import { format, isToday, isYesterday, parseISO } from "date-fns";

const Wallet = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bal, txs] = await Promise.all([getWalletBalance(), getWalletTransactions()]);
      setBalance(bal);
      setTransactions(txs);
    } catch (e) {
      console.error("Wallet fetch error:", e);
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDemoTopUp = async () => {
    setTopUpLoading(true);
    try {
      await creditWallet(500, "Demo top-up");
      toast.success("KSh 500 added to wallet!");
      await fetchData();
    } catch (e) {
      toast.error("Top-up failed");
    } finally {
      setTopUpLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
    return format(d, "MMM d, h:mm a");
  };

  const totalIn = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">MtaaLoop Wallet</h1>
          <Button variant="ghost" size="icon" className="ml-auto rounded-full" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <WalletIcon className="h-5 w-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Available Balance</span>
          </div>
          {loading ? (
            <Skeleton className="h-12 w-40 bg-primary-foreground/20 rounded-lg" />
          ) : (
            <div className="text-4xl font-bold tracking-tight mb-6">
              KSh {(balance ?? 0).toLocaleString()}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 h-11 font-semibold"
              onClick={handleDemoTopUp}
              disabled={topUpLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {topUpLoading ? "Adding..." : "Top Up"}
            </Button>
            <Button variant="secondary" className="flex-1 h-11 font-semibold opacity-60" disabled>
              <ArrowDown className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </Card>

        {/* Stats Row */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground font-medium">Total In</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">+KSh {totalIn.toLocaleString()}</span>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground font-medium">Total Out</span>
              </div>
              <span className="text-lg font-bold text-destructive">-KSh {totalOut.toLocaleString()}</span>
            </Card>
          </div>
        )}

        {/* Transaction History */}
        <Card className="rounded-2xl overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Transactions
            </h3>
            {transactions.length > 0 && (
              <Badge variant="secondary" className="text-xs">{transactions.length}</Badge>
            )}
          </div>
          <Separator />

          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <WalletIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === "credit" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}>
                      {tx.type === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || (tx.type === "credit" ? "Top-up" : "Payment")}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-destructive"}`}>
                    {tx.type === "credit" ? "+" : "-"}KSh {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
