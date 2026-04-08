// src/pages/SupportLiveChat.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Send, Loader2, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

type Msg = {
  id?: string;
  sender_id?: string;
  user_id: string;
  user_role?: 'customer' | 'vendor' | 'admin';
  user_name: string;
  message: string;
  content?: string;
  seen_by?: string[];
  created_at: string;
};

interface ChatMessageRecord {
  sender_id: string;
  content: string;
  created_at: string;
}

export default function SupportLiveChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [chatId, setChatId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 1. Load user
  useEffect(() => {
  supabase.auth.getUser().then(r => setUser(r.data.user));
  }, []);

  const userId = user?.id || 'anon';
  // Use Account.tsx logic for current user's name
  const currentUserName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email?.split("@")[0] as string) ||
    "MtaaLoop User";

  // 2. Get role
  useEffect(() => {
    if (!userId || userId === 'anon') return;
    supabase.rpc('has_role', { uid: userId, r: 'admin' }).then(({ data }) => {
      if (data) setRole('admin');
      else supabase.rpc('has_role', { uid: userId, r: 'vendor' }).then(({ data }) => {
        setRole(data ? 'vendor' : 'customer');
      });
    });
  }, [userId]);

  // 3. NAME CACHE — ONLY auth.users + user_id fallback
  const nameCache = useRef<Map<string, string>>(new Map());

  const getName = async (uid: string): Promise<string> => {
    if (nameCache.current.has(uid)) return nameCache.current.get(uid)!;
    // If it's the current user, use Account.tsx logic
    if (uid === userId && user) {
      nameCache.current.set(uid, currentUserName);
      return currentUserName;
    }
    
    // Use RPC function to fetch user name
    try {
      const { data, error } = await supabase.rpc('get_user_name', { user_id: uid });
      
      if (error) {
        console.error('Error fetching user name:', error);
        return uid.slice(0, 8);
      }
      
      const name = data || uid.slice(0, 8);
      nameCache.current.set(uid, name);
      return name;
    } catch (err) {
      console.error('Exception fetching user name:', err);
      return uid.slice(0, 8);
    }
  };

  // 4. Setup or fetch private chat with admin, then load messages
  useEffect(() => {
    async function setupPrivateChat() {
      if (!user || role === 'admin') return;
      // Check for existing open SUPPORT chat for this user
      // (recipient_role='customer_rep' marks it as a CSR queue chat, distinct
      // from vendor/rider chats the same customer might have open).
      const { data: chat } = await supabase
        .from('private_chats')
        .select('*')
        .eq('initiator_id', userId)
        .eq('recipient_role', 'customer_rep')
        .eq('is_closed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let chat_id = chat?.chat_id;
      // If no chat, create one with recipient_id null (unassigned)
      if (!chat_id) {
        const { data: newChat, error } = await supabase
          .from('private_chats')
          .insert({
            initiator_id: userId,
            initiator_role: role,
            recipient_id: null,
            recipient_role: 'customer_rep', // flag as a support-queue chat so it's routed to CSR
          })
          .select()
          .single();
        if (error || !newChat) return toast.error('Could not create chat');
        chat_id = newChat.chat_id;
      }
      setChatId(chat_id);

      // Load messages for this chat
      const { data: msgs } = await supabase
        .from('private_chat_messages')
        .select('*')
        .eq('chat_id', chat_id)
        .order('created_at');
      if (!msgs) return setMessages([]);
      const enriched = await Promise.all(
        msgs.map(async (m: ChatMessageRecord) => ({
          ...m,
          user_name: await getName(m.sender_id),
          user_id: m.sender_id,
          message: m.content,
        }))
      );
      setMessages(enriched);
    }
    setupPrivateChat();
  }, [user, role, userId]);

  // 5. Realtime
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel('private-chat-' + chatId + '-' + Date.now()) // Unique channel per mount
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_chat_messages', filter: `chat_id=eq.${chatId}` }, async (p) => {
        const name = await getName(p.new.sender_id);
        setMessages(m => [...m, {
          ...p.new,
          user_name: name,
          user_id: p.new.sender_id,
          message: p.new.content,
        } as Msg]);
      })
      .subscribe();
    
    return () => {
      // Properly cleanup the channel - supabase.removeChannel handles unsubscribe
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // 6. Scroll
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  // 7. SEND — ZERO AWAIT IN UI
  const send = async () => {
    if (!input.trim() || !user || !chatId) return;
    const text = input.trim();
    setInput('');
    setIsTyping(true);

    const myName = currentUserName;
    const tempId = 'temp-' + Date.now();

    setMessages(m => [...m, {
      id: tempId,
      user_id: userId,
      user_role: role,
      user_name: myName,
      message: text,
      seen_by: [],
      created_at: new Date().toISOString(),
    }]);

    const { data, error } = await supabase
      .from('private_chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: userId,
        content: text,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed');
      setMessages(m => m.filter(x => x.id !== tempId));
      setInput(text);
    } else {
      // Update cache silently
      const realName = await getName(userId);
      nameCache.current.set(userId, realName);
    }

    setIsTyping(false);
  };

  if (!user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (role === 'admin') {
    return <div className="flex h-screen items-center justify-center text-xl">Admins cannot start chats here.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-2xl h-[720px] flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            title="Close Chat"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Live Support</h2>
          <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Online — reply in seconds
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages?.map(m => (
            <div key={m.id} className={`flex ${m.user_id === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-5 py-3 rounded-3xl shadow-lg ${
                m.user_id === userId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-xs font-bold opacity-90">{m.user_name}</p>
                <p className="text-sm mt-1">{m.message}</p>
                <div className="text-xs opacity-70 mt-2 flex items-center gap-1">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {m.user_id === userId && m.seen_by?.length > 0 && (
                    m.seen_by.length > 1 ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && <div className="text-gray-400 italic">typing...</div>}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <Input
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              className="flex-1"
            />
            <Button onClick={send} disabled={!input.trim() || isTyping}>
              {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
