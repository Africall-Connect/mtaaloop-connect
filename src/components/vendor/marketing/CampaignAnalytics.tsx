import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Users, Mail, MousePointer, TrendingUp, Download } from 'lucide-react';

interface CampaignAnalyticsProps {
  campaignId: string;
  onClose: () => void;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  scheduled_date: string | null;
}

export default function CampaignAnalytics({ campaignId, onClose }: CampaignAnalyticsProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaignAnalytics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaignAnalytics();
  }, [fetchCampaignAnalytics]);

  if (loading || !campaign) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
        <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const opens = Math.round((campaign.sent_count * campaign.open_rate) / 100);
  const clicks = Math.round((campaign.sent_count * campaign.click_rate) / 100);
  const bounces = Math.round(campaign.sent_count * 0.02);
  const conversions = Math.round(clicks * 0.15);

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{campaign.name}</h2>
            <p className="text-sm text-gray-600">Campaign Analytics</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Badge>{campaign.type.toUpperCase()}</Badge>
            <Badge variant="outline">
              Sent: {campaign.scheduled_date && new Date(campaign.scheduled_date).toLocaleDateString()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold">{campaign.sent_count}</div>
                <div className="text-sm text-gray-600">Total Recipients</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-3xl font-bold">{opens}</div>
                <div className="text-sm text-gray-600">Opens ({campaign.open_rate}%)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <MousePointer className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-3xl font-bold">{clicks}</div>
                <div className="text-sm text-gray-600">Clicks ({campaign.click_rate}%)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <div className="text-3xl font-bold">{conversions}</div>
                <div className="text-sm text-gray-600">Conversions</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Open Rate</span>
                  <span className="text-sm font-bold">{campaign.open_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${campaign.open_rate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Click-Through Rate</span>
                  <span className="text-sm font-bold">{campaign.click_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${campaign.click_rate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-sm font-bold">{((conversions / campaign.sent_count) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{ width: `${(conversions / campaign.sent_count) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Bounce Rate</span>
                  <span className="text-sm font-bold">{((bounces / campaign.sent_count) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(bounces / campaign.sent_count) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-green-900 mb-2">Performance Summary</h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Your campaign reached {campaign.sent_count} customers</li>
                <li>• {campaign.open_rate}% open rate is {campaign.open_rate > 20 ? 'above' : 'below'} industry average (20%)</li>
                <li>• {campaign.click_rate}% click rate is {campaign.click_rate > 3 ? 'above' : 'below'} industry average (3%)</li>
                <li>• Generated {conversions} estimated conversions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Recommendations</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                {campaign.open_rate < 20 && <li>• Try improving your subject line to increase open rates</li>}
                {campaign.click_rate < 3 && <li>• Add clearer call-to-action buttons to improve click rates</li>}
                {campaign.open_rate > 20 && <li>• Great open rate! Your subject line is working well</li>}
                {campaign.click_rate > 3 && <li>• Excellent click rate! Your content is engaging customers</li>}
                <li>• Consider A/B testing different messages for better results</li>
                <li>• Send follow-up campaigns to customers who opened but didn't click</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" className="flex-1">
              Create Similar Campaign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
