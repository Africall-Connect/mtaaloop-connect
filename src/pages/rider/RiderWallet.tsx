import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Wallet, CreditCard, Smartphone, TrendingUp, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/exportCSV';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface RiderWalletProps {
  riderId?: string;
}

export default function RiderWallet({ riderId }: RiderWalletProps) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, [riderId]);

  const fetchWalletData = async () => {
    try {
      // Mock data for now - replace with actual API call
      setBalance(12500);
      setTransactions([
        {
          id: '1',
          type: 'credit',
          amount: 2500,
          description: 'Delivery payment - Order #12345',
          date: '2024-01-07',
          status: 'completed'
        },
        {
          id: '2',
          type: 'debit',
          amount: 500,
          description: 'MPesa withdrawal',
          date: '2024-01-06',
          status: 'completed'
        },
        {
          id: '3',
          type: 'credit',
          amount: 1800,
          description: 'Delivery payment - Order #12344',
          date: '2024-01-06',
          status: 'completed'
        },
        {
          id: '4',
          type: 'credit',
          amount: 3200,
          description: 'Weekly bonus',
          date: '2024-01-05',
          status: 'completed'
        },
      ]);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (amount: number) => {
    try {
      // Mock withdrawal - replace with actual API call
      console.log('Withdrawing:', amount);
      setBalance(prev => prev - amount);
      // Add transaction to list
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Wallet className="h-5 w-5" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900 mb-2">
              KES {balance.toLocaleString()}
            </div>
            <p className="text-green-700 text-sm">
              Ready for withdrawal or MPesa transfer
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handleWithdrawal(Math.min(balance, 10000))}
                disabled={balance < 100}
                className="bg-green-600 hover:bg-green-700"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Withdraw to MPesa
              </Button>
              <Button variant="outline" className="border-green-300 text-green-700" onClick={() => { exportToCSV(transactions.map(t => ({ description: t.description, type: t.type, amount: t.amount, status: t.status, date: t.date })), 'wallet-statement'); toast.success("Statement downloaded"); }}>
                <Download className="h-4 w-4 mr-2" />
                View Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Weekly Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 15,000</div>
            <p className="text-sm text-gray-600 mt-1">Next payout: Friday</p>
            <Progress value={83} className="mt-3" />
            <p className="text-xs text-gray-500 mt-1">83% of weekly goal</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal History</TabsTrigger>
          <TabsTrigger value="settings">Payment Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'credit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}KES {transaction.amount.toLocaleString()}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          transaction.status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {transaction.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {transaction.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {transaction.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No withdrawal history yet</p>
                  <p className="text-sm">Your MPesa withdrawals will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">MPesa Number</h4>
                <p className="text-sm text-gray-600 mb-2">+254 712 345 678</p>
                <Button variant="outline" size="sm" onClick={() => toast.info("Contact support to update your M-Pesa number")}>
                  Update Number
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Auto Withdrawal</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Automatically withdraw earnings above KES 5,000 every Friday
                </p>
                <Button variant="outline" size="sm" onClick={() => toast.info("Auto withdrawal configuration coming soon")}>
                  Configure Auto Withdrawal
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-2">Minimum Withdrawal</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Current minimum: KES 100
                </p>
                <p className="text-xs text-gray-500">
                  MPesa charges may apply for withdrawals under KES 500
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
