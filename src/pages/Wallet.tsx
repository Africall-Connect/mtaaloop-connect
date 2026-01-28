import { Link } from "react-router-dom";
import { ArrowLeft, Plus, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Wallet = () => {
  const transactions = [
    { type: "credit", amount: 500, description: "Top-up", date: "Today" },
    { type: "debit", amount: 420, description: "Order payment", date: "Today" },
    { type: "credit", amount: 100, description: "Referral bonus", date: "2 days ago" },
    { type: "credit", amount: 20, description: "Cashback", date: "3 days ago" },
    { type: "debit", amount: 350, description: "Order payment", date: "5 days ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">💚 MtaaLoop Wallet</h1>
        </div>

        <Card className="p-8 mb-6 text-center bg-gradient-to-br from-primary to-accent text-white">
          <div className="text-sm opacity-90 mb-2">BALANCE</div>
          <div className="text-5xl font-bold mb-6">KSh 450</div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Top Up
            </Button>
            <Button variant="secondary">
              <ArrowDown className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Loyalty Points: 234</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>→ KSh 200 credit</span>
              <span className="text-muted-foreground">(Need 250 points)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>→ Free delivery</span>
              <span className="text-muted-foreground">(Need 100 points)</span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: "93.6%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">93.6% to KSh 200 credit</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Transaction History</h3>
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <div className="font-medium">
                    {tx.type === "credit" ? "+" : "-"} KSh {tx.amount}
                  </div>
                  <div className="text-sm text-muted-foreground">{tx.description}</div>
                </div>
                <div className="text-sm text-muted-foreground">{tx.date}</div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Transactions
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
