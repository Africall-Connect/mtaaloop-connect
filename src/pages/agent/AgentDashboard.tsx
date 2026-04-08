import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Briefcase,
  Package,
  Star,
  TrendingUp,
  Wallet,
  Bell,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Sun,
  Moon,
  Settings,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Play,
  FileText,
  Sparkles,
  Shirt,
  UtensilsCrossed,
  Trash2,
  User,
} from 'lucide-react';

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [online, setOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('agent-online') === 'true';
    return false;
  });
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Theme state with green dark mode (mirrors rider)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('agent-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('agent-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('service_requests')
        .select('*') as any)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('fetchMyRequests error:', error);
        toast.error('Failed to load tasks: ' + (error.message || 'Unknown'));
        setRequests([]);
      } else {
        setRequests((data as ServiceRequest[]) || []);
      }
    } catch (e: any) {
      console.error('fetchMyRequests exception:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchMyRequests();
  }, [user, fetchMyRequests]);

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

  const messageCustomer = async (customerId: string) => {
    try {
      const { findOrCreateChatWithCustomer } = await import('@/lib/csrChat');
      if (!user) return;
      const chatId = await findOrCreateChatWithCustomer(user.id, customerId, 'agent');
      navigate(`/inbox?chat=${chatId}`);
    } catch (e: any) {
      toast.error('Failed: ' + (e?.message || 'Unknown'));
    }
  };

  const handleOnlineToggle = (checked: boolean) => {
    setOnline(checked);
    localStorage.setItem('agent-online', String(checked));
  };

  // Stats (mirror rider stats shape)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayRequests = requests.filter(r => new Date(r.created_at) >= today);
  const todayCompleted = todayRequests.filter(r => r.status === 'completed').length;
  const activeRequests = requests.filter(r => ['assigned', 'in_progress'].includes(r.status));
  const completedAll = requests.filter(r => r.status === 'completed').length;
  const pendingAssigned = requests.filter(r => r.status === 'assigned').length;

  const stats = {
    todayTasks: todayRequests.length,
    todayCompleted,
    activeTasks: activeRequests.length,
    completedTasks: completedAll,
    todayEarnings: 0, // wallet not yet wired for agents
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    rating: 5.0,
    totalTasks: requests.length,
    pendingTasks: pendingAssigned,
  };

  // The "current" active task (in_progress) — mirrors rider active delivery card
  const currentTask = requests.find(r => r.status === 'in_progress');

  const renderTaskCard = (req: ServiceRequest) => {
    const ServiceIcon = serviceIcons[req.service_type] || FileText;
    return (
      <Card key={req.id} className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <ServiceIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold capitalize">{(req.service_type || 'service').replace(/_/g, ' ')}</span>
              {req.urgency && (
                <Badge className={urgencyColors[req.urgency] || 'bg-muted'} variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {req.urgency?.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
            {req.description && (
              <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> Customer: {req.user_id ? `${req.user_id.slice(0, 8)}…` : 'Unknown'}</span>
              {req.errand_type && <span>Type: {req.errand_type.replace(/_/g, ' ')}</span>}
              {req.location_scope && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location_scope.replace(/_/g, ' ')}</span>}
              {req.contact_number && (
                <a href={`tel:${req.contact_number}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Phone className="w-3 h-3" /> {req.contact_number}
                </a>
              )}
              <span>{new Date(req.created_at).toLocaleString()}</span>
            </div>
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
            {req.status !== 'completed' && req.status !== 'cancelled' && (
              <div className="flex gap-2 flex-wrap">
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
                <Button size="sm" variant="outline" className="gap-1" onClick={() => messageCustomer(req.user_id)}>
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
  };

  // Customers (unique users this agent has served) — for the Customers tab
  const customers = Array.from(
    requests.reduce((map, r) => {
      if (!map.has(r.user_id)) map.set(r.user_id, { count: 0, last: r.created_at, contact: r.contact_number });
      const c = map.get(r.user_id)!;
      c.count += 1;
      if (new Date(r.created_at) > new Date(c.last)) c.last = r.created_at;
      if (r.contact_number) c.contact = r.contact_number;
      return map;
    }, new Map<string, { count: number; last: string; contact: string | null }>()).entries()
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-emerald-950 dark:to-green-950 font-sans dark:font-mono">
      {/* HEADER */}
      <header className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:via-emerald-900 dark:to-green-900 border-b border-gray-200 dark:border-emerald-700/50 sticky top-0 z-50 backdrop-blur-sm dark:backdrop-blur-md">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left: Profile */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {user?.user_metadata?.full_name || 'Agent'}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 mt-1">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Label htmlFor="online-toggle" className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} /> {online ? 'ONLINE' : 'OFFLINE'}
                    </Label>
                    <Switch
                      id="online-toggle"
                      checked={online}
                      onCheckedChange={handleOnlineToggle}
                      className="scale-75 sm:scale-100 data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setActiveView(activeView === 'notifications' ? null : 'notifications')}
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                {stats.pendingTasks > 0 && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500 rounded-full" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => navigate('/inbox')}
                title="Inbox"
              >
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <Button onClick={signOut} variant="outline" size="sm" className="hidden sm:inline-flex border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-2 sm:mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3">Overview</TabsTrigger>
                <TabsTrigger value="active-tasks" className="text-xs sm:text-sm px-1 sm:px-3">Active Tasks</TabsTrigger>
                <TabsTrigger value="customers" className="text-xs sm:text-sm px-1 sm:px-3">Customers</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm px-1 sm:px-3">Analytics</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs sm:text-sm px-1 sm:px-3">Insights</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Active Task Section (mirrors rider active delivery) */}
        {currentTask && (
          <Card className="border-blue-200 dark:border-blue-300 bg-blue-50/50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2 text-base sm:text-lg">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                Current Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Service</p>
                  <p className="text-sm sm:text-lg truncate text-gray-900 dark:text-gray-100 capitalize">{(currentTask.service_type || 'service').replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Customer</p>
                  <p className="text-sm sm:text-lg truncate text-gray-900 dark:text-gray-100">{currentTask.user_id ? `${currentTask.user_id.slice(0, 8)}…` : 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
                  <p className="text-sm sm:text-lg truncate text-gray-900 dark:text-gray-100">{currentTask.location_scope?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-300 text-xs">
                    {currentTask.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto">
                <Button onClick={() => updateStatus(currentTask.id, 'completed')} className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm" size="sm">
                  ✅ Mark Complete
                </Button>
                <Button variant="outline" onClick={() => messageCustomer(currentTask.user_id)} className="text-xs sm:text-sm" size="sm">
                  💬 Message Customer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
            {/* Today's Tasks */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Today's Tasks</CardTitle>
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold">{stats.todayTasks}</div>
                <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">{stats.todayCompleted} done today</p>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Active: {stats.activeTasks}</span>
                  <span className="text-gray-600">Done: {stats.completedTasks}</span>
                </div>
                <Button variant="link" className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto" size="sm" onClick={() => setActiveTab('active-tasks')}>
                  View All Tasks →
                </Button>
              </CardContent>
            </Card>

            {/* Today's Earnings */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Today's Earnings</CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold">KES {stats.todayEarnings.toLocaleString()}</div>
                <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Tracking soon</p>
                </div>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                  <p className="text-xs sm:text-sm text-gray-600">Weekly: KES {stats.weeklyEarnings.toLocaleString()}</p>
                </div>
                <Button variant="link" className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto" size="sm" onClick={() => setActiveView('earnings')}>
                  View Breakdown →
                </Button>
              </CardContent>
            </Card>

            {/* Wallet Balance */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Wallet Balance</CardTitle>
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold">KES 0</div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Available for withdrawal</p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                  <p className="text-xs sm:text-sm text-gray-600">Pending: KES 0</p>
                </div>
                <Button variant="link" className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto" size="sm" onClick={() => setActiveView('wallet')}>
                  View Wallet →
                </Button>
              </CardContent>
            </Card>

            {/* Performance Rating */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Performance Rating</CardTitle>
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="text-2xl sm:text-3xl font-bold">{stats.rating.toFixed(1)}</div>
                  <span className="text-lg sm:text-2xl">⭐</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">{stats.totalTasks} total tasks</p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                  <p className="text-xs sm:text-sm text-gray-600">Monthly: KES {stats.monthlyEarnings.toLocaleString()}</p>
                </div>
                <Button variant="link" className="w-full mt-1 sm:mt-2 text-xs p-0 h-auto" size="sm" onClick={() => setActiveTab('insights')}>
                  View Analytics →
                </Button>
              </CardContent>
            </Card>

            {/* Attention Needed */}
            <Card className="hover:shadow-lg transition-shadow border-amber-200 bg-amber-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Attention Needed</CardTitle>
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 sm:space-y-2">
                  {stats.pendingTasks > 0 && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs px-1 py-0">⚠️</Badge>
                      <span className="text-xs sm:text-sm">{stats.pendingTasks} Pending Tasks</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1 py-0">ℹ️</Badge>
                    <span className="text-xs sm:text-sm">Status {online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <Button variant="link" className="w-full mt-2 sm:mt-3 text-xs p-0 h-auto" size="sm" onClick={() => setActiveTab('active-tasks')}>
                  View Details →
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ACTIVE TASKS TAB */}
        {activeTab === 'active-tasks' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : activeRequests.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">No active tasks. Check back soon!</Card>
            ) : (
              activeRequests.map(renderTaskCard)
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <Card>
            <CardHeader><CardTitle>Customers Served</CardTitle></CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No customers yet.</p>
              ) : (
                <div className="space-y-2">
                  {customers.map(([id, info]) => (
                    <div key={id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{id ? `${id.slice(0, 8)}…` : 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{info.count} task{info.count > 1 ? 's' : ''} · last {new Date(info.last).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {info.contact && (
                          <Button asChild size="sm" variant="outline">
                            <a href={`tel:${info.contact}`}><Phone className="w-3 h-3" /></a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => messageCustomer(id)}>
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <Card>
            <CardHeader><CardTitle>Task Analytics</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Total tasks</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
                <p className="text-2xl font-bold">{stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active now</p>
                <p className="text-2xl font-bold">{stats.activeTasks}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <Card>
            <CardHeader><CardTitle>Business Insights</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Insights coming soon. We'll show task trends, busiest hours, and customer satisfaction.</p>
            </CardContent>
          </Card>
        )}

        {/* Notifications dialog */}
        <Dialog open={activeView === 'notifications'} onOpenChange={(open) => !open && setActiveView(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Notifications</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              {stats.pendingTasks > 0 ? (
                <p>⚠️ You have {stats.pendingTasks} pending task{stats.pendingTasks > 1 ? 's' : ''}.</p>
              ) : (
                <p className="text-muted-foreground">No new notifications.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Earnings dialog */}
        <Dialog open={activeView === 'earnings'} onOpenChange={(open) => !open && setActiveView(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Earnings</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Earnings tracking for agents will be enabled once payouts are wired up.</p>
          </DialogContent>
        </Dialog>

        {/* Wallet dialog */}
        <Dialog open={activeView === 'wallet'} onOpenChange={(open) => !open && setActiveView(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Wallet & Payouts</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Wallet for agents is coming soon.</p>
          </DialogContent>
        </Dialog>

        {/* Settings dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Appearance</h3>
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-toggle" className="text-sm">Dark Mode</Label>
                  <Switch id="theme-toggle" checked={theme === 'dark'} onCheckedChange={() => toggleTheme()} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Status</h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="online-toggle-settings" className="text-sm">Online Status</Label>
                    <p className="text-xs text-muted-foreground">{online ? 'Available for tasks' : 'Offline - not receiving tasks'}</p>
                  </div>
                  <Switch id="online-toggle-settings" checked={online} onCheckedChange={handleOnlineToggle} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Account</h3>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
