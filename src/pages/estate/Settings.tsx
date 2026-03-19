import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Shield, Bell, CreditCard, Users, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import { EmergencyContact, MaintenanceSchedule, ErrorResponse } from '@/types/common';

interface EstateSettings {
  id: string;
  notifications_settings: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    new_resident_requests: boolean;
    new_vendor_applications: boolean;
    order_notifications: boolean;
    payment_notifications: boolean;
  };
  payment_methods: string[];
  service_fees: {
    delivery_fee: number;
    service_fee_percentage: number;
    minimum_order: number;
  };
  policies: {
    resident_policy: string;
    vendor_policy: string;
    refund_policy: string;
    privacy_policy: string;
  };
  emergency_contacts: EmergencyContact[];
  maintenance_schedule: MaintenanceSchedule;
  rules_and_regulations: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EstateSettings | null>(null);
  const [formData, setFormData] = useState({
    notifications_settings: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      new_resident_requests: true,
      new_vendor_applications: true,
      order_notifications: true,
      payment_notifications: true,
    },
    payment_methods: ['mpesa', 'card'],
    service_fees: {
      delivery_fee: 50,
      service_fee_percentage: 5,
      minimum_order: 100,
    },
    policies: {
      resident_policy: '',
      vendor_policy: '',
      refund_policy: '',
      privacy_policy: '',
    },
    emergency_contacts: [],
    maintenance_schedule: {},
    rules_and_regulations: ''
  });

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('estates')
        .select('*')
        .eq('approved_by', user?.id)
        .single();

      if (error) throw error;

      const settingsData = {
        id: data.id,
        notifications_settings: data.notifications_settings || formData.notifications_settings,
        payment_methods: data.payment_methods || formData.payment_methods,
        service_fees: data.service_fees || formData.service_fees,
        policies: data.policies || formData.policies,
        emergency_contacts: data.emergency_contacts || [],
        maintenance_schedule: data.maintenance_schedule || {},
        rules_and_regulations: data.rules_and_regulations || ''
      };

      setSettings(settingsData);
      setFormData(settingsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load estate settings');
    } finally {
      setLoading(false);
    }
  }, [user?.id, formData.notifications_settings, formData.payment_methods, formData.service_fees, formData.policies]);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('estates')
        .update({
          notifications_settings: formData.notifications_settings,
          payment_methods: formData.payment_methods,
          service_fees: formData.service_fees,
          policies: formData.policies,
          emergency_contacts: formData.emergency_contacts,
          maintenance_schedule: formData.maintenance_schedule,
          rules_and_regulations: formData.rules_and_regulations
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Settings updated successfully');
      fetchSettings();
    } catch (error) {
      const err = error as ErrorResponse;
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications_settings: {
        ...prev.notifications_settings,
        [key]: value
      }
    }));
  };

  const updateServiceFee = (key: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      service_fees: {
        ...prev.service_fees,
        [key]: value
      }
    }));
  };

  const updatePolicy = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      policies: {
        ...prev.policies,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Settings not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Estate Settings</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={formData.notifications_settings.email_notifications}
                  onCheckedChange={(checked) => updateNotificationSetting('email_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <Switch
                  id="sms-notifications"
                  checked={formData.notifications_settings.sms_notifications}
                  onCheckedChange={(checked) => updateNotificationSetting('sms_notifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={formData.notifications_settings.push_notifications}
                  onCheckedChange={(checked) => updateNotificationSetting('push_notifications', checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Notification Types</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resident-requests">New Resident Requests</Label>
                  <Switch
                    id="resident-requests"
                    checked={formData.notifications_settings.new_resident_requests}
                    onCheckedChange={(checked) => updateNotificationSetting('new_resident_requests', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="vendor-applications">New Vendor Applications</Label>
                  <Switch
                    id="vendor-applications"
                    checked={formData.notifications_settings.new_vendor_applications}
                    onCheckedChange={(checked) => updateNotificationSetting('new_vendor_applications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="order-notifications">Order Notifications</Label>
                  <Switch
                    id="order-notifications"
                    checked={formData.notifications_settings.order_notifications}
                    onCheckedChange={(checked) => updateNotificationSetting('order_notifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment-notifications">Payment Notifications</Label>
                  <Switch
                    id="payment-notifications"
                    checked={formData.notifications_settings.payment_notifications}
                    onCheckedChange={(checked) => updateNotificationSetting('payment_notifications', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Fees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment & Service Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delivery-fee">Delivery Fee (KES)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  value={formData.service_fees.delivery_fee}
                  onChange={(e) => updateServiceFee('delivery_fee', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="service-fee">Service Fee (%)</Label>
                <Input
                  id="service-fee"
                  type="number"
                  value={formData.service_fees.service_fee_percentage}
                  onChange={(e) => updateServiceFee('service_fee_percentage', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="minimum-order">Minimum Order (KES)</Label>
                <Input
                  id="minimum-order"
                  type="number"
                  value={formData.service_fees.minimum_order}
                  onChange={(e) => updateServiceFee('minimum_order', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <Label>Accepted Payment Methods</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['mpesa', 'card', 'cash', 'bank_transfer'].map((method) => (
                  <Button
                    key={method}
                    variant={formData.payment_methods.includes(method) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        payment_methods: prev.payment_methods.includes(method)
                          ? prev.payment_methods.filter(m => m !== method)
                          : [...prev.payment_methods, method]
                      }));
                    }}
                  >
                    {method.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estate Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resident-policy">Resident Policy</Label>
              <Textarea
                id="resident-policy"
                value={formData.policies.resident_policy}
                onChange={(e) => updatePolicy('resident_policy', e.target.value)}
                placeholder="Enter resident policy..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="vendor-policy">Vendor Policy</Label>
              <Textarea
                id="vendor-policy"
                value={formData.policies.vendor_policy}
                onChange={(e) => updatePolicy('vendor_policy', e.target.value)}
                placeholder="Enter vendor policy..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="refund-policy">Refund Policy</Label>
              <Textarea
                id="refund-policy"
                value={formData.policies.refund_policy}
                onChange={(e) => updatePolicy('refund_policy', e.target.value)}
                placeholder="Enter refund policy..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="privacy-policy">Privacy Policy</Label>
              <Textarea
                id="privacy-policy"
                value={formData.policies.privacy_policy}
                onChange={(e) => updatePolicy('privacy_policy', e.target.value)}
                placeholder="Enter privacy policy..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rules & Regulations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Rules & Regulations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="rules">Estate Rules and Regulations</Label>
              <Textarea
                id="rules"
                value={formData.rules_and_regulations}
                onChange={(e) => setFormData(prev => ({ ...prev, rules_and_regulations: e.target.value }))}
                placeholder="Enter estate rules and regulations..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
