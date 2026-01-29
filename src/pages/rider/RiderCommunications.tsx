import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare, Mail, Send, Search, User, Clock,
  CheckCheck, Phone, Filter, Archive
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  customer_id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
  customer?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string;
  };
}

interface Conversation {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  messages: Message[];
}

export default function RiderCommunications() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchConversations = useCallback(async () => {
    try {
      const { data: messagesData } = await supabase
        .from('rider_messages')
        .select(`
          *,
          customer:customers(first_name, last_name, email, phone)
        `)
        .eq('rider_id', user?.id)
        .order('created_at', { ascending: false });

      const conversationMap = new Map<string, Conversation>();

      messagesData?.forEach(msg => {
        const customerId = msg.customer_id;
        const customerName = msg.customer?.first_name
          ? `${msg.customer.first_name} ${msg.customer.last_name || ''}`.trim()
          : 'Customer';

        if (!conversationMap.has(customerId)) {
          conversationMap.set(customerId, {
            customer_id: customerId,
            customer_name: customerName,
            customer_email: msg.customer?.email || '',
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            messages: []
          });
        }

        const conversation = conversationMap.get(customerId)!;
        if (!msg.is_read && msg.sender_type === 'customer') {
          conversation.unread_count++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (customerId: string) => {
    try {
      const { data } = await supabase
        .from('rider_messages')
        .select(`
          *,
          customer:customers(first_name, last_name, email, phone)
        `)
        .eq('rider_id', user?.id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: true });

      setMessages(data || []);

      await supabase
        .from('rider_messages')
        .update({ is_read: true })
        .eq('rider_id', user?.id)
        .eq('customer_id', customerId)
        .eq('sender_type', 'customer');

      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, fetchConversations]);

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel('rider-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rider_messages',
        filter: `rider_id=eq.${user?.id}`
      }, () => {
        fetchConversations();
        if (selectedConversation) {
          fetchMessages(selectedConversation);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation, fetchConversations, fetchMessages]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user, fetchConversations, setupRealtimeSubscription]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('rider_messages')
        .insert([{
          rider_id: user?.id,
          customer_id: selectedConversation,
          message: newMessage,
          sender_type: 'rider',
          is_read: false
        }]);

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent');
      fetchMessages(selectedConversation);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations
    .filter(conv => {
      if (filter === 'unread' && conv.unread_count === 0) return false;
      if (searchTerm) {
        return conv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               conv.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
  const selectedConv = conversations.find(c => c.customer_id === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">COMMUNICATIONS HUB</h1>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {unreadCount} unread
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <Card className="col-span-1 flex flex-col">
            <CardHeader className="border-b">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    onClick={() => setFilter('unread')}
                  >
                    Unread ({unreadCount})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map(conv => (
                    <div
                      key={conv.customer_id}
                      onClick={() => setSelectedConversation(conv.customer_id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation === conv.customer_id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {conv.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{conv.customer_name}</div>
                            <div className="text-xs text-gray-500">{conv.customer_email}</div>
                          </div>
                        </div>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="rounded-full">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-2">{conv.last_message}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(conv.last_message_time)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {selectedConv.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{selectedConv.customer_name}</div>
                        <div className="text-sm text-gray-600">{selectedConv.customer_email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => {
                    const isRider = msg.sender_type === 'rider';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isRider ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isRider ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-lg p-3 ${
                              isRider
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isRider ? 'justify-end' : 'justify-start'}`}>
                            <Clock className="h-3 w-3" />
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isRider && msg.is_read && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={2}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No conversation selected</p>
                  <p className="text-sm">Select a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
