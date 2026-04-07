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
      .eq("is_closed", false)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load queue: " + error.message);
    } else {
      setChats((data as Chat[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnassigned();

    // Realtime: refresh when new chats appear or any chat updates
    const channel = supabase
      .channel("csr-chat-queue")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_chats" }, () => fetchUnassigned())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "private_chats" }, () => fetchUnassigned())
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
          {chats.map((chat) => (
            <Card key={chat.chat_id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                    {chat.initiator_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm font-mono">
                      Customer {chat.initiator_id.slice(0, 8)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      Started {timeAgo(chat.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">Waiting</Badge>
                  <Button size="sm" onClick={() => claimChat(chat.chat_id)} disabled={claiming === chat.chat_id}>
                    {claiming === chat.chat_id ? "Claiming..." : "Claim"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
