import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { toast } from 'sonner';
import { ErrorResponse } from '@/types/common';

interface Campaign {
  id: string;
  name: string;
  type: string;
  target_segment: string;
  message: string;
  status: string;
  scheduled_date: string | null;
}

interface CampaignFormDialogProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSuccess: () => void;
  vendorId: string;
}

export default function CampaignFormDialog({ campaign, onClose, onSuccess, vendorId }: CampaignFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    target_segment: 'all',
    message: '',
    status: 'draft',
    scheduled_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        type: campaign.type,
        target_segment: campaign.target_segment,
        message: campaign.message,
        status: campaign.status,
        scheduled_date: campaign.scheduled_date ? new Date(campaign.scheduled_date).toISOString().slice(0, 16) : '',
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const campaignData = {
        vendor_id: vendorId,
        name: formData.name,
        type: formData.type,
        target_segment: formData.target_segment,
        message: formData.message,
        status: formData.status,
        scheduled_date: formData.scheduled_date || null,
        sent_count: 0,
        open_rate: 0,
        click_rate: 0,
      };

      if (campaign) {
        const { error } = await supabase
          .from('marketing_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;
        toast.success('Campaign updated successfully');
      } else {
        const { error } = await supabase
          .from('marketing_campaigns')
          .insert([campaignData]);

        if (error) throw error;
        toast.success('Campaign created successfully');
      }

      onSuccess();
    } catch (error) {
      const err = error as ErrorResponse;
      toast.error('Failed to save campaign', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Weekend Special Offer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type *</Label>
              <select
                id="type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_segment">Target Audience *</Label>
              <select
                id="target_segment"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.target_segment}
                onChange={(e) => setFormData({ ...formData, target_segment: e.target.value })}
                required
              >
                <option value="all">All Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="regular">Regular Customers</option>
                <option value="returning">Returning Customers</option>
                <option value="new">New Customers</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              placeholder="Write your campaign message here..."
            />
            <p className="text-xs text-gray-500">
              {formData.type === 'sms' && `${formData.message.length}/160 characters`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="draft">Save as Draft</option>
                <option value="scheduled">Schedule Campaign</option>
              </select>
            </div>

            {formData.status === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Schedule Date & Time *</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required={formData.status === 'scheduled'}
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900 mb-2">Campaign Preview:</p>
            <div className="bg-white p-3 rounded border">
              <p className="font-medium mb-1">{formData.name || 'Campaign Name'}</p>
              <p className="text-gray-600">{formData.message || 'Your message will appear here...'}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (campaign ? 'Update Campaign' : 'Create Campaign')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
