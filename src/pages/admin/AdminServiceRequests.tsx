import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Clock, User, MapPin, Phone, MessageSquare, Trash2, Sparkles, Shirt, UtensilsCrossed, Package, FileText, Droplets } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SERVICE_TYPE_META, ServiceType } from '@/types/subscription';

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
  assigned_at: string | null;
  completed_at: string | null;
  agent_notes: string | null;
}

interface AgentOption {
  id: string;
  label: string;
}

const serviceIcons: Record<string, typeof Trash2> = {
  trash_collection: Trash2,
  errand: FileText,
  cleaning: Sparkles,
  laundry: Shirt,
  meal_prep: UtensilsCrossed,
  package_collection: Package,
  osha_viombo: Droplets,
};

// Resolve canonical display name from service_type
const getServiceDisplayName = (serviceType: string | null): string => {
  if (serviceType && SERVICE_TYPE_META[serviceType as ServiceType]) {
    return SERVICE_TYPE_META[serviceType as ServiceType].displayName;
  }
  return serviceType || 'Unknown service';
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    fetchRequests();
    fetchAgents();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setRequests((data as unknown as ServiceRequest[]) || []);
    setLoading(false);
  };

  const fetchAgents = async () => {
    // Fetch users with 'agent' role
    const { data } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'agent');
    
    if (data && data.length > 0) {
      const userIds = data.map(r => r.user_id);
      const { data: users } = await supabase.rpc('get_user_details_by_id', { user_ids: userIds });
      if (users) {
        setAgents(users.map((u: any) => ({
          id: u.id,
          label: u.raw_user_meta_data?.full_name || u.email || u.id.slice(0, 8),
        })));
      }
    }
  };

  const assignAgent = async (requestId: string, agentId: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ 
        assigned_to: agentId, 
        assigned_at: new Date().toISOString(),
        status: 'assigned' 
      } as any)
      .eq('id', requestId);
    
    if (error) {
      toast.error('Failed to assign agent');
    } else {
      toast.success('Agent assigned!');
      fetchRequests();
    }
  };

  const updateStatus = async (requestId: string, status: string) => {
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', requestId);
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${status}`);
      fetchRequests();
    }
  };

  const filtered = requests.filter(r => {
    if (tab === 'all') return true;
    return r.status === tab;
  });

  const Icon = (type: string) => serviceIcons[type] || FileText;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Service Requests</h1>
          <p className="text-sm text-muted-foreground">Manage all incoming service requests</p>
        </div>
        <Badge variant="secondary" className="ml-auto">{requests.length} total</Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending ({requests.filter(r => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({requests.filter(r => r.status === 'assigned').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({requests.filter(r => r.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({requests.filter(r => r.status === 'completed').length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No {tab === 'all' ? '' : tab} requests found.
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => {
                const ServiceIcon = Icon(req.service_type);
                return (
                  <Card key={req.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Left: Icon + Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ServiceIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{getServiceDisplayName(req.service_type)}</span>
                            <Badge className={statusColors[req.status] || 'bg-muted'} variant="secondary">
                              {req.status.replace(/_/g, ' ')}
                            </Badge>
                            {req.urgency && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {req.urgency.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>

                          {req.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                          )}

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {req.user_id.slice(0, 8)}…
                            </span>
                            {req.errand_type && (
                              <span>Type: {req.errand_type.replace(/_/g, ' ')}</span>
                            )}
                            {req.location_scope && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {req.location_scope.replace(/_/g, ' ')}
                              </span>
                            )}
                            {req.channel_preference && (
                              <span className="flex items-center gap-1">
                                {req.channel_preference === 'whatsapp' ? <Phone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                {req.channel_preference}
                              </span>
                            )}
                            {req.contact_number && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {req.contact_number}
                              </span>
                            )}
                            <span>{new Date(req.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        {agents.length > 0 && req.status !== 'completed' && (
                          <Select onValueChange={(val) => assignAgent(req.id, val)} value={req.assigned_to || undefined}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Assign agent..." />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {req.status === 'pending' && agents.length === 0 && (
                          <p className="text-xs text-muted-foreground">No agents registered yet. Add users with the 'agent' role.</p>
                        )}

                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <div className="flex gap-1">
                            {req.status === 'assigned' && (
                              <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => updateStatus(req.id, 'in_progress')}>
                                Start
                              </Button>
                            )}
                            {(req.status === 'in_progress' || req.status === 'assigned') && (
                              <Button size="sm" className="text-xs flex-1" onClick={() => updateStatus(req.id, 'completed')}>
                                Complete
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" className="text-xs" onClick={() => updateStatus(req.id, 'cancelled')}>
                              Cancel
                            </Button>
                          </div>
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
