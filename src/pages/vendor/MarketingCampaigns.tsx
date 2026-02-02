import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Plus, Send, Mail, MessageSquare, Users,
  TrendingUp, Eye, Edit, Trash2, Copy, Calendar, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import CampaignFormDialog from '@/components/vendor/marketing/CampaignFormDialog';
import CampaignAnalytics from '@/components/vendor/marketing/CampaignAnalytics';

interface Campaign {
  id: string;
  name: string;
  type: string;
  target_segment: string;
  message: string;
  status: string;
  scheduled_date: string | null;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string;
}

export default function MarketingCampaigns() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      // 1) get the vendor profile for this logged-in user
      const { data: vendorProfile, error: vpError } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_approved', true)
        .maybeSingle();

      if (vpError) throw vpError;

      if (!vendorProfile) {
        // no approved vendor -> nothing to show
        setCampaigns([]);
        return;
      }

      // 2) now fetch campaigns using the REAL vendor_id
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('vendor_id', vendorProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user, fetchCampaigns]);

  useEffect(() => {
    const loadVendor = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_approved', true)
        .maybeSingle();

      if (!error && data) {
        setVendorProfileId(data.id);
      }
    };
    loadVendor();
  }, [user]);

  const getCampaignStats = () => {
    const total = campaigns.length;
    const draft = campaigns.filter(c => c.status === 'draft').length;
    const scheduled = campaigns.filter(c => c.status === 'scheduled').length;
    const sent = campaigns.filter(c => c.status === 'sent').length;
    const totalRecipients = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
    const avgOpenRate = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.open_rate, 0) / campaigns.length
      : 0;

    return { total, draft, scheduled, sent, totalRecipients, avgOpenRate };
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const duplicateCampaign = async (campaign: Campaign) => {
    try {
      const { id, created_at, sent_count, open_rate, click_rate, ...campaignData } = campaign;
      const { error } = await supabase
        .from('marketing_campaigns')
        .insert([{
          ...campaignData,
          name: `${campaign.name} (Copy)`,
          status: 'draft',
          vendor_id: user?.id
        }]);

      if (error) throw error;
      toast.success('Campaign duplicated');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to duplicate campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const sendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign now?')) return;

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          status: 'sent',
          sent_count: 0,
          scheduled_date: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;
      toast.success('Campaign sent successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to send campaign');
    }
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowFormDialog(true);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="h-4 w-4" />;
    if (type === 'sms') return <MessageSquare className="h-4 w-4" />;
    return <Send className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'sent': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['draft'];
  };

  const stats = getCampaignStats();
  const filteredCampaigns = filterCampaigns();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/vendor/portal')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">MARKETING</h1>
            </div>
            <Button size="sm" onClick={() => setShowFormDialog(true)} className="shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Campaign</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <Send className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-blue-600" />
              <div className="text-xl sm:text-3xl font-bold text-blue-700">{stats.total}</div>
              <div className="text-xs sm:text-sm text-blue-600 mt-1">Total</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <Edit className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-gray-600" />
              <div className="text-xl sm:text-3xl font-bold text-gray-700">{stats.draft}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Drafts</div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-amber-600" />
              <div className="text-xl sm:text-3xl font-bold text-amber-700">{stats.scheduled}</div>
              <div className="text-xs sm:text-sm text-amber-600 mt-1">Scheduled</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-green-600" />
              <div className="text-xl sm:text-3xl font-bold text-green-700">{stats.totalRecipients}</div>
              <div className="text-xs sm:text-sm text-green-600 mt-1">Reached</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200 col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-purple-600" />
              <div className="text-xl sm:text-3xl font-bold text-purple-700">{stats.avgOpenRate.toFixed(1)}%</div>
              <div className="text-xs sm:text-sm text-purple-600 mt-1">Open Rate</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" onValueChange={setStatusFilter}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-max sm:w-full justify-start bg-white border whitespace-nowrap">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{campaigns.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs sm:text-sm">
                Drafts <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{stats.draft}</Badge>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs sm:text-sm">
                Scheduled <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{stats.scheduled}</Badge>
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs sm:text-sm">
                Sent <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{stats.sent}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={statusFilter} className="mt-4">
            {filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No campaigns found</p>
                  <Button className="mt-4" onClick={() => setShowFormDialog(true)}>
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCampaigns.map(campaign => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(campaign.type)}
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {campaign.target_segment}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{campaign.message}</p>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(campaign.created_at).toLocaleDateString()}
                            {campaign.scheduled_date && (
                              <> • Scheduled: {new Date(campaign.scheduled_date).toLocaleString()}</>
                            )}
                          </div>
                        </div>
                      </div>

                      {campaign.status === 'sent' && (
                        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Recipients</p>
                            <p className="text-lg font-bold">{campaign.sent_count}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Open Rate</p>
                            <p className="text-lg font-bold">{campaign.open_rate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Click Rate</p>
                            <p className="text-lg font-bold">{campaign.click_rate}%</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        {campaign.status === 'draft' && (
                          <>
                            <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                              <Send className="h-4 w-4 mr-1" />
                              Send Now
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(campaign)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        )}
                        {campaign.status === 'sent' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCampaignId(campaign.id);
                              setShowAnalytics(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Analytics
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => duplicateCampaign(campaign)}>
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteCampaign(campaign.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {showFormDialog && (
        <CampaignFormDialog
          campaign={editingCampaign}
          onClose={() => {
            setShowFormDialog(false);
            setEditingCampaign(null);
          }}
          onSuccess={() => {
            fetchCampaigns();
            setShowFormDialog(false);
            setEditingCampaign(null);
          }}
          vendorId={vendorProfileId || ''}
        />
      )}

      {showAnalytics && selectedCampaignId && (
        <CampaignAnalytics
          campaignId={selectedCampaignId}
          onClose={() => {
            setShowAnalytics(false);
            setSelectedCampaignId(null);
          }}
        />
      )}
    </div>
  );
}
