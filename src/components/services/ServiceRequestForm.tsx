import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, MessageSquare, Calendar, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useApartment } from '@/contexts/ApartmentContext';
import { MicroService } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';

interface ServiceRequestFormProps {
  service: MicroService;
  onSuccess?: (requestId: string) => void;
}

export function ServiceRequestForm({ service, onSuccess }: ServiceRequestFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentApartment } = useApartment();
  const { isSubscribed, checkCanUseService, consumeServiceUsage, getRemainingUsage } = useSubscription();

  const [houseNumber, setHouseNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUseForFree = isSubscribed && checkCanUseService(service.subscription_key);
  const remaining = isSubscribed ? getRemainingUsage(service.subscription_key) : 0;
  const effectivePrice = canUseForFree ? 0 : service.base_price;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to request this service');
      navigate('/auth/login');
      return;
    }

    if (!houseNumber.trim()) {
      toast.error('Please enter your house number');
      return;
    }

    if (service.requires_scheduling && !scheduledFor) {
      toast.error('Please select a time slot');
      return;
    }

    setIsSubmitting(true);

    try {
      // If using subscription, consume usage
      let isSubscriptionUsage = false;
      if (canUseForFree) {
        const consumed = await consumeServiceUsage(service.subscription_key);
        if (consumed) {
          isSubscriptionUsage = true;
        }
      }

      // Create service request
      const { data: request, error } = await supabase
        .from('service_requests')
        .insert({
          service_id: service.id,
          service_name: service.name,
          customer_id: user.id,
          estate_id: currentApartment?.id !== 'general-location' ? currentApartment?.id : null,
          amount: isSubscriptionUsage ? 0 : service.base_price,
          is_subscription_usage: isSubscriptionUsage,
          payment_status: isSubscriptionUsage ? 'paid' : 'pending',
          house_number: houseNumber,
          customer_notes: notes,
          scheduled_for: scheduledFor || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Service requested successfully!');
      
      if (onSuccess) {
        onSuccess(request.id);
      } else {
        // Navigate to tracking page
        navigate(`/service-tracking/${request.id}`);
      }
    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error('Failed to request service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subscription status */}
      {isSubscribed && canUseForFree && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-emerald-700">
                Included in your subscription
              </span>
              <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-300">
                {remaining === 'unlimited' ? 'Unlimited' : `${remaining} left this month`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show upgrade prompt if not subscribed */}
      {!isSubscribed && (
        <UpgradePrompt service={service.name} variant="banner" />
      )}

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-3xl">{service.icon}</span>
            <div>
              <h2 className="text-xl">{service.name}</h2>
              <p className="text-sm font-normal text-muted-foreground">
                {service.description}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              House Number / Location
            </Label>
            <Input
              placeholder="e.g., Block A, House 12"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
            />
            {currentApartment && currentApartment.id !== 'general-location' && (
              <p className="text-xs text-muted-foreground">
                📍 {currentApartment.name}
              </p>
            )}
          </div>

          {/* Scheduling (if required) */}
          {service.requires_scheduling && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Time
              </Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Special Instructions (Optional)
            </Label>
            <Textarea
              placeholder="Any special instructions for our agent..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Time estimate */}
          {service.estimated_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {service.estimated_time}</span>
            </div>
          )}

          {/* Price Summary */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service Fee</span>
              <div className="text-right">
                {canUseForFree ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-600">Free</span>
                    <span className="text-sm text-muted-foreground line-through">
                      KSh {service.base_price}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold">KSh {service.base_price}</span>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Requesting...' : canUseForFree ? 'Request Service (Free)' : `Request Service - KSh ${service.base_price}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
