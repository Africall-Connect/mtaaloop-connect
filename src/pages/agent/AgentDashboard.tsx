import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, Clock, MapPin, MessageSquare, Phone, Play, FileText, Sparkles, Shirt, UtensilsCrossed, Package, Trash2, User } from 'lucide-react';

interface ServiceRequest {
  id: string;
  user_id: string;
  service_type: string;
  status: string;
  created_at: string;
  description: string | null;
  channel_preference: string | null;
  errand_type: string | null;
  location_scope: string | null;
  urgency: string | null;
  contact_number: string | null;
  assigned_to: string | null;
  agent_notes: string | null;
}

const serviceIcons: Record<string, typeof Trash2> = {
  trash_collection: Trash2,
  errand: FileText,
  cleaning: Sparkles,
  laundry: Shirt,
  meal_prep: UtensilsCrossed,
  package_collection: Package,
};

const urgencyColors: Record<string, string> = {
  right_now: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  within_hour: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  later_today: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  schedule: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AgentDashboard() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState('assigned');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const fetchMyRequests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await (supabase
      .from('service_requests')
      .select('*') as any)
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });
    
    if (!error) setRequests((data as ServiceRequest[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchMyRequests();
  }, [userId, fetchMyRequests]);

  const updateStatus = async (requestId: string, status: string) => {
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', requestId);
    
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(status === 'completed' ? 'Task completed! 🎉' : 'Status updated');
      fetchMyRequests();
    }
  };

  const saveNotes = async (requestId: string) => {
    const notes = notesMap[requestId];
    if (!notes) return;
    
    const { error } = await supabase
      .from('service_requests')
      .update({ agent_notes: notes } as any)
      .eq('id', requestId);
    
    if (error) toast.error('Failed to save notes');
    else toast.success('Notes saved');
  };

  const filtered = requests.filter(r => {
    if (tab === 'all') return true;
    if (tab === 'active') return ['assigned', 'in_progress'].includes(r.status);
    return r.status === tab;
  });

  const activeCount = requests.filter(r => ['assigned', 'in_progress'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-sm text-muted-foreground">Your assigned service requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{activeCount}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{completedCount}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{requests.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="completed">Done ({completedCount})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              {tab === 'active' ? 'No active tasks. Check back soon!' : 'No tasks found.'}
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => {
                const ServiceIcon = serviceIcons[req.service_type] || FileText;
                return (
                  <Card key={req.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <ServiceIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold capitalize">{req.service_type.replace(/_/g, ' ')}</span>
                          {req.urgency && (
                            <Badge className={urgencyColors[req.urgency] || 'bg-muted'} variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {req.urgency.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        {req.description && (
                          <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                        )}

                        {/* Details */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> Customer: {req.user_id.slice(0, 8)}…
                          </span>
                          {req.errand_type && <span>Type: {req.errand_type.replace(/_/g, ' ')}</span>}
                          {req.location_scope && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {req.location_scope.replace(/_/g, ' ')}
                            </span>
                          )}
                          {req.channel_preference && (
                            <span className="flex items-center gap-1">
                              {req.channel_preference === 'whatsapp' ? <Phone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                              Contact via {req.channel_preference}
                            </span>
                          )}
                          {req.contact_number && (
                            <a href={`tel:${req.contact_number}`} className="flex items-center gap-1 text-primary hover:underline">
                              <Phone className="w-3 h-3" /> {req.contact_number}
                            </a>
                          )}
                          <span>{new Date(req.created_at).toLocaleString()}</span>
                        </div>

                        {/* Agent Notes */}
                        {req.status !== 'completed' && (
                          <div className="mb-3">
                            <Textarea
                              placeholder="Add notes about this task..."
                              className="text-xs min-h-[60px]"
                              value={notesMap[req.id] ?? req.agent_notes ?? ''}
                              onChange={(e) => setNotesMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                              onBlur={() => saveNotes(req.id)}
                            />
                          </div>
                        )}
                        {req.status === 'completed' && req.agent_notes && (
                          <p className="text-xs bg-muted p-2 rounded mb-2">📝 {req.agent_notes}</p>
                        )}

                        {/* Action Buttons */}
                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <div className="flex gap-2">
                            {req.status === 'assigned' && (
                              <Button size="sm" onClick={() => updateStatus(req.id, 'in_progress')} className="gap-1">
                                <Play className="w-3 h-3" /> Start Task
                              </Button>
                            )}
                            {req.status === 'in_progress' && (
                              <Button size="sm" onClick={() => updateStatus(req.id, 'completed')} className="gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Mark Complete
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="gap-1" onClick={async () => {
                              try {
                                const { findOrCreateChatWithCustomer } = await import('@/lib/csrChat');
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user || !req.user_id) { toast.error('Cannot start chat'); return; }
                                const chatId = await findOrCreateChatWithCustomer(user.id, req.user_id, 'agent');
                                window.location.href = `/inbox?chat=${chatId}`;
                              } catch (e: any) {
                                toast.error('Failed: ' + (e?.message || 'Unknown'));
                              }
                            }}>
                              <MessageSquare className="w-3 h-3" /> Message Customer
                            </Button>
                          </div>
                        )}

                        {req.status === 'completed' && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
