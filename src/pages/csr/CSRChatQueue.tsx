import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";

interface Chat {
  chat_id: string;
  initiator_id: string;
  initiator_role: string | null;
  is_closed: boolean;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  initiator_name?: string;
  unread_count?: number;
}

export default function CSRChatQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchUnassigned = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("private_chats") as any)
      .select("*")
      .is("recipient_id", null)
      .eq("recipient_role", "customer_rep")
      .eq("is_closed", false)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load queue: " + error.message);
      setLoading(false);
      return;
    }
    const base = (data as Chat[]) || [];
    if (base.length === 0) {
      setChats([]);
      setLoading(false);
      return;
    }
    // Fetch last message for each chat + initiator name
    const enriched = await Promise.all(
      base.map(async (c) => {
        const [msgRes, nameRes] = await Promise.all([
          (supabase.from("private_chat_messages") as any)
            .select("content, created_at")
            .eq("chat_id", c.chat_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          (supabase.from("customer_profiles") as any)
            .select("full_name")
            .eq("user_id", c.initiator_id)
            .maybeSingle(),
        ]);
        return {
          ...c,
          last_message: (msgRes.data as any)?.content ?? "",
          last_message_at: (msgRes.data as any)?.created_at ?? c.created_at,
          initiator_name: (nameRes.data as any)?.full_name ?? null,
        } as Chat;
      })
    );
    // Sort by last_message_at desc
    enriched.sort((a, b) =>
      new Date(b.last_message_at || b.created_at).getTime() -
      new Date(a.last_message_at || a.created_at).getTime()
    );
    setChats(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnassigned();

    // Realtime: refresh when new chats appear or any chat updates or messages arrive
    const channel = supabase
      .channel("csr-chat-queue")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_chats" }, () => fetchUnassigned())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "private_chats" }, () => fetchUnassigned())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_chat_messages" }, () => fetchUnassigned())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnassigned]);

  const claimChat = async (chatId: string) => {
    if (!user) return;
    setClaiming(chatId);
    const { error } = await (supabase.from("private_chats") as any)
      .update({ recipient_id: user.id, recipient_role: "customer_rep" })
      .eq("chat_id", chatId);
    if (error) {
      toast.error("Failed to claim: " + error.message);
      setClaiming(null);
    } else {
      toast.success("Chat claimed!");
      navigate(`/csr/inbox?chat=${chatId}`);
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Unassigned chats</h2>
          <p className="text-sm text-slate-500">Customers waiting for a representative</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUnassigned}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">Loading queue...</CardContent>
        </Card>
      ) : chats.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No customers waiting</h3>
            <p className="text-sm text-slate-500">All chats have been picked up.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {chats.map((chat) => {
            const displayName = chat.initiator_name || `Customer ${chat.initiator_id.slice(0, 8)}`;
            const initials = (chat.initiator_name || chat.initiator_id)
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <Card key={chat.chat_id} className="hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/csr/inbox?chat=${chat.chat_id}`)}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{displayName}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{chat.initiator_role || "customer"}</Badge>
                      </div>
                      {chat.last_message ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">{chat.last_message}</p>
                      ) : (
                        <p className="text-sm italic text-slate-400 dark:text-slate-500 mt-0.5">No messages yet</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(chat.last_message_at || chat.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">Waiting</Badge>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); claimChat(chat.chat_id); }} disabled={claiming === chat.chat_id}>
                      {claiming === chat.chat_id ? "Claiming..." : "Claim"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
