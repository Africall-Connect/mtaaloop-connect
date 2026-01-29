// src/pages/AdminLiveChatAssign.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface Chat {
  id: string;
  chat_id: string;
  initiator_id: string;
  recipient_id: string | null;
  recipient_role: string | null;
  is_closed: boolean;
  created_at: string;
}

export default function AdminLiveChatAssign() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(r => setUser(r.data.user));
  }, []);

  useEffect(() => {
    async function fetchUnassignedChats() {
      setLoading(true);
      const { data } = await supabase
        .from('private_chats')
        .select('*')
        .is('recipient_id', null)
        .eq('is_closed', false)
        .order('created_at', { ascending: false });
      setChats(data || []);
      setLoading(false);
    }
    fetchUnassignedChats();
  }, []);

  const assignChat = async (chat_id: string) => {
    if (!user) return toast.error('Not logged in');
    const { error } = await supabase
      .from('private_chats')
      .update({ recipient_id: user.id, recipient_role: 'admin' })
      .eq('chat_id', chat_id);
    if (error) {
      toast.error('Failed to assign chat');
    } else {
      toast.success('Chat assigned!');
      setChats(chats => chats.filter(c => c.chat_id !== chat_id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Unassigned Live Chats</h2>
      {loading ? (
        <div>Loading...</div>
      ) : chats.length === 0 ? (
        <div className="text-gray-400">No unassigned chats.</div>
      ) : (
        <div className="space-y-4">
          {chats.map(chat => (
            <Card key={chat.chat_id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">From: {chat.initiator_id}</div>
                <div className="text-xs text-gray-500">Started: {new Date(chat.created_at).toLocaleString()}</div>
              </div>
              <Button onClick={() => assignChat(chat.chat_id)}>
                Assign to Me
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
