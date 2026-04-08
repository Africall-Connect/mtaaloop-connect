import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerSnapshot } from "@/hooks/useCustomerSnapshot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ExternalLink, Wallet, ShoppingCart, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Chat {
  chat_id: string;
  initiator_id: string;
  initiator_role: string | null;
  recipient_id: string | null;
  recipient_role: string | null;
  is_closed: boolean;
  created_at: string;
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function CSRInbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch my chats (assigned to me)
  const fetchMyChats = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("private_chats") as any)
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });
    setChats((data as Chat[]) || []);
  }, [user]);

  useEffect(() => {
    fetchMyChats();

    const channel = supabase
      .channel("csr-inbox-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "private_chats" }, () => fetchMyChats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMyChats]);

  // Auto-select chat from URL param
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c.chat_id === chatId);
      if (chat && chat.chat_id !== selectedChat?.chat_id) {
        setSelectedChat(chat);
      }
    }
  }, [searchParams, chats, selectedChat]);

  // Fetch messages when chat selected
  useEffect(() => {
    if (!selectedChat) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase.from("private_chat_messages") as any)
        .select("*")
        .eq("chat_id", selectedChat.chat_id)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data as Message[]) || []);
    })();

    const channel = supabase
      .channel(`csr-chat-${selectedChat.chat_id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "private_chat_messages",
        filter: `chat_id=eq.${selectedChat.chat_id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat || !user) return;
    setSending(true);
    const { error } = await (supabase.from("private_chat_messages") as any).insert({
      chat_id: selectedChat.chat_id,
      sender_id: user.id,
      sender_role: 'customer_rep',
      content: input.trim(),
    });
    if (error) {
      toast.error("Failed to send: " + error.message);
    } else {
      setInput("");
    }
    setSending(false);
  };

  const closeChat = async () => {
    if (!selectedChat) return;
    if (!confirm("Mark this chat as resolved and close it?")) return;
    const { error } = await (supabase.from("private_chats") as any)
      .update({ is_closed: true })
      .eq("chat_id", selectedChat.chat_id);
    if (error) {
      toast.error("Failed to close: " + error.message);
    } else {
      toast.success("Chat closed");
      setSelectedChat(null);
      fetchMyChats();
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Chat list */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm">My active chats ({chats.filter(c => !c.is_closed).length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No chats. Visit the <Link to="/csr/queue" className="text-emerald-600 underline">queue</Link> to claim one.
            </div>
          ) : (
            chats.map((c) => (
              <button
                key={c.chat_id}
                onClick={() => {
                  setSelectedChat(c);
                  setSearchParams({ chat: c.chat_id });
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
                  selectedChat?.chat_id === c.chat_id && "bg-emerald-50 dark:bg-emerald-950/20",
                  c.is_closed && "opacity-60"
                )}
              >
                <div className="font-mono text-xs truncate text-slate-900 dark:text-slate-100">{c.initiator_id.slice(0, 12)}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Date(c.created_at).toLocaleDateString()}
                  {c.is_closed && " · closed"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a chat from the list to start
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-sm font-mono truncate text-slate-900 dark:text-slate-100">{selectedChat.initiator_id.slice(0, 12)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Started {new Date(selectedChat.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                {!selectedChat.is_closed && (
                  <Button variant="outline" size="sm" onClick={closeChat}>Close chat</Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-slate-500 mt-8">No messages yet</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        {(msg as any).sender_role && (
                          <div className={cn(
                            "text-[9px] font-semibold uppercase mb-0.5 tracking-wide",
                            isMe ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"
                          )}>
                            {(msg as any).sender_role === 'customer_rep' ? 'Support'
                              : (msg as any).sender_role === 'admin' ? 'Admin'
                              : (msg as any).sender_role === 'vendor' ? 'Vendor'
                              : (msg as any).sender_role === 'rider' ? 'Rider'
                              : (msg as any).sender_role === 'agent' ? 'Agent'
                              : 'Customer'}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className={cn("text-[10px] mt-1", isMe ? "text-emerald-100" : "text-slate-400")}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {!selectedChat.is_closed && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your reply..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  />
                  <Button onClick={sendMessage} disabled={sending || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer context panel */}
      {selectedChat && (
        <CustomerContextPanel customerId={selectedChat.initiator_id} />
      )}
    </div>
  );
}

function CustomerContextPanel({ customerId }: { customerId: string }) {
  const snap = useCustomerSnapshot(customerId);

  return (
    <div className="hidden lg:flex w-72 border-l border-slate-200 dark:border-slate-800 flex-col bg-white dark:bg-slate-950 overflow-y-auto">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-sm">Customer context</h3>
      </div>
      <div className="p-4 space-y-4">
        {snap.loading ? (
          <div className="text-xs text-slate-500">Loading...</div>
        ) : (
          <>
            {/* Profile */}
            <div>
              <div className="font-semibold text-sm">{snap.profile?.name || "Unknown"}</div>
              <div className="text-xs text-slate-500 truncate">{snap.profile?.email}</div>
              {snap.profile?.phone && (
                <div className="text-xs text-slate-500">{snap.profile.phone}</div>
              )}
              {snap.profile?.created_at && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Member since {new Date(snap.profile.created_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Wallet */}
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Wallet className="h-3 w-3" /> Wallet balance
              </div>
              <div className="text-lg font-bold">
                KSh {snap.wallet?.balance.toLocaleString() || 0}
              </div>
            </Card>

            {/* Recent orders */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                <ShoppingCart className="h-3 w-3" /> Recent orders ({snap.recentOrders.length})
              </div>
              {snap.recentOrders.length === 0 ? (
                <div className="text-xs text-slate-400">No orders</div>
              ) : (
                <div className="space-y-1.5">
                  {snap.recentOrders.map((o) => (
                    <div key={o.id} className="text-xs flex items-center justify-between gap-2">
                      <div className="font-mono text-slate-600 truncate">{o.order_number || o.id.slice(0, 8)}</div>
                      <div className="font-semibold shrink-0">KSh {Number(o.total_amount || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent tickets */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                <TicketIcon className="h-3 w-3" /> Recent tickets ({snap.recentTickets.length})
              </div>
              {snap.recentTickets.length === 0 ? (
                <div className="text-xs text-slate-400">No tickets</div>
              ) : (
                <div className="space-y-1.5">
                  {snap.recentTickets.map((t) => (
                    <div key={t.id} className="text-xs">
                      <div className="font-medium truncate">{t.subject}</div>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link to={`/csr/customers/${customerId}`}>
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-3 w-3 mr-2" />
                Open full profile
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
