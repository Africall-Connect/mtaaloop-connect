// src/pages/Inbox.tsx - Full featured inbox with chat list and messaging
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Loader2, Trash2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface PrivateChat {
  chat_id: string;
  initiator_id: string;
  initiator_role: string;
  recipient_id: string | null;
  recipient_role: string | null;
  created_at: string;
}

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [selectedChat, setSelectedChat] = useState<PrivateChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userChats, setUserChats] = useState<PrivateChat[]>([]);
  const [lastMessages, setLastMessages] = useState<Map<string, string>>(new Map());
  const [chatNames, setChatNames] = useState<Map<string, string>>(new Map());
  const [messageSenderNames, setMessageSenderNames] = useState<Map<string, string>>(new Map());
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nameCache = useRef<Map<string, string>>(new Map());
  const isInitialLoad = useRef(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(r => {
      setUser(r.data.user);
    });
  }, []);

  const userId = user?.id || 'anon';
  const currentUserName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email?.split("@")[0] as string) ||
    "User";

  // Get role
  useEffect(() => {
    if (!userId || userId === 'anon') return;
    supabase.rpc('has_role', { uid: userId, r: 'admin' }).then(({ data }) => {
      if (data) {
        setRole('admin');
      } else {
        supabase.rpc('has_role', { uid: userId, r: 'vendor' }).then(({ data }) => {
          setRole(data ? 'vendor' : 'customer');
        });
      }
    });
  }, [userId]);

  // Name resolution using RPC function
  const getName = async (uid: string): Promise<string> => {
    if (nameCache.current.has(uid)) return nameCache.current.get(uid)!;
    if (uid === userId && user) {
      nameCache.current.set(uid, currentUserName);
      return currentUserName;
    }
    
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

  const loadChats = useCallback(async () => {
    if (!user) return;

    if (isInitialLoad.current) {
      setLoading(true);
      isInitialLoad.current = false;
    }

    let query = supabase
      .from('private_chats')
      .select('*')
      .eq('is_closed', false);

    if (role !== 'admin') {
      query = query.or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data: chats, error: chatsError } = await query;

    if (chatsError) {
      toast.error('Error fetching chats');
      setLoading(false);
      return;
    }

    if (chats) {
      const chatsWithLastMessage = await Promise.all(
        chats.map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from('private_chat_messages')
            .select('content, created_at')
            .eq('chat_id', chat.chat_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          return {
            ...chat,
            lastMessageContent: lastMessage?.content || 'No messages yet',
            lastMessageAt: lastMessage ? new Date(lastMessage.created_at) : new Date(chat.created_at),
          };
        })
      );

      chatsWithLastMessage.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
      
      setUserChats(chatsWithLastMessage);

      const newLastMessages = new Map<string, string>();
      const newChatNames = new Map<string, string>();

      for (const chat of chatsWithLastMessage) {
        newLastMessages.set(chat.chat_id, chat.lastMessageContent);
        const otherUserId = chat.initiator_id === userId ? chat.recipient_id : chat.initiator_id;
        if (otherUserId) {
          const name = await getName(otherUserId);
          newChatNames.set(chat.chat_id, name);
        }
      }
      
      setLastMessages(newLastMessages);
      setChatNames(newChatNames);
    }

    setLoading(false);
  }, [user, userId, role]);

  // Load chats and subscribe to real-time updates
  useEffect(() => {
    if (user) {
      loadChats();
    }

    const channel = supabase
      .channel('inbox-refresh')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'private_chats' },
        () => loadChats()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_chat_messages' },
        () => loadChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadChats]);

  // Load messages for selected chat and fetch sender names
  useEffect(() => {
    async function loadMessages() {
      if (!selectedChat) {
        setMessages([]);
        setMessageSenderNames(new Map());
        return;
      }

      const { data: msgs } = await supabase
        .from('private_chat_messages')
        .select('*')
        .eq('chat_id', selectedChat.chat_id)
        .order('created_at');
      
      setMessages(msgs || []);
      
      // Fetch names for all message senders
      if (msgs) {
        const newSenderNames = new Map<string, string>();
        const uniqueSenderIds = [...new Set(msgs.map(m => m.sender_id))];
        
        for (const senderId of uniqueSenderIds) {
          const name = await getName(senderId);
          newSenderNames.set(senderId, name);
        }
        
        setMessageSenderNames(newSenderNames);
      }
    }
    loadMessages();
  }, [selectedChat]);

  // Real-time subscription for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    
    const channel = supabase
      .channel('inbox-chat-' + selectedChat.chat_id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_chat_messages',
          filter: `chat_id=eq.${selectedChat.chat_id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          setMessages(m => [...m, newMessage]);
          
          // Fetch sender name if not already cached
          if (!messageSenderNames.has(newMessage.sender_id)) {
            const name = await getName(newMessage.sender_id);
            setMessageSenderNames(prev => new Map(prev).set(newMessage.sender_id, name));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, messageSenderNames]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !user || !selectedChat) return;
    
    const text = input.trim();
    setInput('');
    setSending(true);

    const { error } = await supabase
      .from('private_chat_messages')
      .insert({
        chat_id: selectedChat.chat_id,
        sender_id: userId,
        content: text,
      });

    if (error) {
      toast.error('Failed to send message');
      setInput(text);
    }

    setSending(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this chat? This action cannot be undone.');
    if (!isConfirmed) {
      return;
    }

    const { error } = await supabase.from('private_chats').delete().eq('chat_id', chatId);

    if (error) {
      toast.error('Failed to delete chat: ' + error.message);
    } else {
      toast.success('Chat deleted successfully');
      setUserChats(prevChats => prevChats.filter(chat => chat.chat_id !== chatId));
      if (selectedChat?.chat_id === chatId) {
        setSelectedChat(null);
      }
    }
  };

  // Get other person's info in chat
  const getOtherPersonName = (chat: PrivateChat) => {
    // First check if we have the cached name
    if (chatNames.has(chat.chat_id)) {
      return chatNames.get(chat.chat_id);
    }
    
    // If no recipient assigned yet
    const otherUserId = chat.initiator_id === userId ? chat.recipient_id : chat.initiator_id;
    if (!otherUserId) {
      return 'Unassigned';
    }
    
    // Fallback while loading
    return 'Loading...';
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Get last message preview
  const getLastMessagePreview = async (chatId: string) => {
    const { data } = await supabase
      .from('private_chat_messages')
      .select('content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data?.content || 'No messages yet';
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold truncate">Inbox</h1>
          <p className="text-xs sm:text-sm text-gray-500">{userChats.length} conversations</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List - Left Panel (hidden on mobile when chat selected) */}
        <div className={cn(
          "bg-white border-r overflow-y-auto",
          "w-full md:w-80",
          selectedChat && "hidden md:block"
        )}>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : userChats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No conversations yet
            </div>
          ) : (
            <div>
              {userChats.map((chat) => (
                <div
                  key={chat.chat_id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "p-3 sm:p-4 border-b cursor-pointer hover:bg-gray-50 transition",
                    selectedChat?.chat_id === chat.chat_id && "bg-indigo-50 border-l-4 border-indigo-600"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {getOtherPersonName(chat)}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </span>
                      {role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.chat_id);
                          }}
                          className="p-1 h-auto"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 truncate">
                    {lastMessages.get(chat.chat_id) || '...'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages - Right Panel (full width on mobile when chat selected) */}
        <div className={cn(
          "flex-1 flex flex-col bg-gray-50",
          !selectedChat && "hidden md:flex"
        )}>
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Send className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header with back button on mobile */}
              <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden shrink-0 p-1"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {getOtherPersonName(selectedChat)}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedChat.recipient_id ? 'Active' : 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-5 py-3 rounded-3xl shadow ${
                          msg.sender_id === userId
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        <p className="text-xs font-bold opacity-90">
                          {messageSenderNames.get(msg.sender_id) || 'Loading...'}
                        </p>
                        <p className="text-sm mt-1">{msg.content}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t p-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
