import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerSnapshot } from "@/hooks/useCustomerSnapshot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Wallet, ShoppingCart, MapPin, Ticket as TicketIcon, Mail, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { findOrCreateChatWithCustomer } from "@/lib/csrChat";

export default function CSRCustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const snap = useCustomerSnapshot(customerId);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (!customerId) return;
    fetchAll();
  }, [customerId]);

  const fetchAll = async () => {
    if (!customerId) return;
    const [o, wtx, t, ch, a] = await Promise.all([
      supabase.from("orders").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(50),
      (supabase.from("customer_wallet_tx") as any).select("*").eq("user_id", customerId).order("created_at", { ascending: false }).limit(50),
      (supabase.from("support_tickets") as any).select("*").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(50),
      (supabase.from("private_chats") as any).select("*").eq("initiator_id", customerId).order("created_at", { ascending: false }).limit(50),
      (supabase.from("customer_addresses") as any).select("*").eq("user_id", customerId).limit(20),
    ]);
    setOrders((o.data as any[]) || []);
    setWalletTx((wtx.data as any[]) || []);
    setTickets((t.data as any[]) || []);
    setChats((ch.data as any[]) || []);
    setAddresses((a.data as any[]) || []);
  };

  const startChat = async () => {
    if (!user || !customerId) return;
    try {
      const chatId = await findOrCreateChatWithCustomer(user.id, customerId);
      toast.success("Chat opened");
      navigate(`/csr/inbox?chat=${chatId}`);
    } catch (e: any) {
      toast.error("Failed to start chat: " + (e?.message || "Unknown error"));
    }
  };

  // Hook always returns a profile (placeholder at minimum), so we no longer
  // bail out on "customer not found" — render whatever we have.
  if (!customerId) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-slate-500">No customer ID provided</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {(snap.profile?.name || snap.profile?.email || "?")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold truncate">{snap.profile?.name || "Unnamed Customer"}</h2>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                  {snap.profile?.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {snap.profile.email}</span>
                  )}
                  {snap.profile?.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {snap.profile.phone}</span>
                  )}
                  {snap.profile?.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Joined {new Date(snap.profile.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-mono text-slate-400">{customerId}</div>
              </div>
            </div>
            <Button onClick={startChat}>
              <MessageSquare className="h-4 w-4 mr-2" /> Start chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><Wallet className="h-3 w-3" /> Wallet</div>
          <div className="text-xl font-bold mt-1">KSh {snap.wallet?.balance.toLocaleString() || 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Total orders</div>
          <div className="text-xl font-bold mt-1">{orders.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><TicketIcon className="h-3 w-3" /> Tickets filed</div>
          <div className="text-xl font-bold mt-1">{tickets.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-slate-500 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Total chats</div>
          <div className="text-xl font-bold mt-1">{chats.length}</div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="wallet">Wallet ({walletTx.length})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="chats">Chats ({chats.length})</TabsTrigger>
          <TabsTrigger value="addresses">Addresses ({addresses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-3">
          <Card>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No orders yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="text-left px-3 py-2">Order #</th>
                      <th className="text-right px-3 py-2">Total</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 font-mono text-xs">{o.order_number || o.id.slice(0, 8)}</td>
                        <td className="px-3 py-2 text-right">KSh {Number(o.total_amount || 0).toLocaleString()}</td>
                        <td className="px-3 py-2"><Badge variant="outline">{o.status || "—"}</Badge></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="mt-3">
          <Card>
            <CardContent className="p-0">
              {walletTx.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No wallet transactions</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-right px-3 py-2">Amount</th>
                      <th className="text-left px-3 py-2">Description</th>
                      <th className="text-left px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletTx.map((tx) => (
                      <tr key={tx.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2"><Badge variant="outline">{tx.type}</Badge></td>
                        <td className={`px-3 py-2 text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}KSh {Number(tx.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs">{tx.description || "—"}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-3">
          <Card>
            <CardContent className="p-0">
              {tickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No tickets filed</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.map((t) => (
                    <div key={t.id} className="px-4 py-3">
                      <div className="font-medium text-sm">{t.subject}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.description}</div>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats" className="mt-3">
          <Card>
            <CardContent className="p-0">
              {chats.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No chats yet</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {chats.map((c) => (
                    <div key={c.chat_id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-xs">{c.chat_id.slice(0, 12)}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()} · {c.is_closed ? "closed" : "active"}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/csr/inbox?chat=${c.chat_id}`)}>
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-3">
          <Card>
            <CardContent className="p-4">
              {addresses.length === 0 ? (
                <div className="text-center text-slate-500 text-sm">No saved addresses</div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <div key={a.id} className="text-sm flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        {a.label && <div className="font-medium text-xs">{a.label}</div>}
                        <div>{[a.estate_name, a.house_number, a.street_address, a.city].filter(Boolean).join(", ")}</div>
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
