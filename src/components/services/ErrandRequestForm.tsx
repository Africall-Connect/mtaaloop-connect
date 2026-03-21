import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Phone, Send, MapPin, Clock, Info,
  AlertCircle, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useApartment } from '@/contexts/ApartmentContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown } from 'lucide-react';

const ERRAND_TYPES = [
  { value: 'buy_something', label: 'Buy something for me' },
  { value: 'deliver_item', label: 'Deliver an item' },
  { value: 'pay_bill', label: 'Pay a bill' },
  { value: 'queue_for_me', label: 'Queue for me' },
  { value: 'pickup', label: 'Pick up something' },
  { value: 'drop_off', label: 'Drop off something' },
  { value: 'other', label: 'Something else' },
];

const URGENCY_OPTIONS = [
  { value: 'right_now', label: 'Right now', badge: '⚡' },
  { value: 'within_hour', label: 'Within the hour', badge: '🕐' },
  { value: 'later_today', label: 'Later today', badge: '🌤️' },
  { value: 'schedule', label: 'Schedule it', badge: '📅' },
];

const CHANNEL_OPTIONS = [
  { value: 'in_app', label: 'In-App Chat', icon: MessageSquare, desc: 'Chat with your agent here' },
  { value: 'whatsapp', label: 'WhatsApp', icon: Phone, desc: 'Agent contacts you on WhatsApp' },
  { value: 'phone_call', label: 'Phone Call', icon: Phone, desc: 'Agent calls you directly' },
];

export function ErrandRequestForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentApartment } = useApartment();
  const { isSubscribed, checkCanUseService, consumeServiceUsage, getRemainingUsage } = useSubscription();

  const [channel, setChannel] = useState('in_app');
  const [contactNumber, setContactNumber] = useState('');
  const [errandType, setErrandType] = useState('');
  const [locationScope, setLocationScope] = useState('within_estate');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('within_hour');
  const [scheduledFor, setScheduledFor] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canUseForFree = isSubscribed && checkCanUseService('errand');
  const remaining = isSubscribed ? getRemainingUsage('errand') : 0;

  const basePrice = 100;
  const distanceTopUp = locationScope === 'nairobi_wide' ? 100 : 0;
  const totalPrice = canUseForFree ? 0 : basePrice + distanceTopUp;

  const needsContact = channel === 'whatsapp' || channel === 'phone_call';

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login first');
      navigate('/auth/login');
      return;
    }
    if (!errandType) { toast.error('Please select an errand type'); return; }
    if (!description.trim()) { toast.error('Please describe your errand'); return; }
    if (!houseNumber.trim()) { toast.error('Please enter your house number'); return; }
    if (needsContact && !contactNumber.trim()) { toast.error('Please enter your contact number'); return; }
    if (urgency === 'schedule' && !scheduledFor) { toast.error('Please pick a time'); return; }

    setIsSubmitting(true);
    try {
      let isSubUsage = false;
      if (canUseForFree) {
        const consumed = await consumeServiceUsage('errand');
        if (consumed) isSubUsage = true;
      }

      const { data, error } = await supabase
        .from('service_requests')
        .insert({
          service_id: 'errands-service',
          service_name: 'Run Errands',
          customer_id: user.id,
          estate_id: currentApartment?.id !== 'general-location' ? currentApartment?.id : null,
          amount: isSubUsage ? 0 : basePrice + distanceTopUp,
          is_subscription_usage: isSubUsage,
          payment_status: isSubUsage ? 'paid' : 'pending',
          house_number: houseNumber,
          customer_notes: null,
          status: 'pending',
          service_type: 'errand',
          channel_preference: channel,
          errand_type: errandType,
          location_scope: locationScope,
          urgency,
          description,
          contact_number: needsContact ? contactNumber : null,
          scheduled_for: urgency === 'schedule' ? scheduledFor : null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setSubmitted(true);
      toast.success('Errand request submitted!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Send className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-emerald-800 mb-2">Request Received! 🎉</h3>
          <p className="text-sm text-emerald-700 mb-1">
            Your errand has been submitted. An agent will be assigned shortly.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {channel === 'in_app' && "We'll notify you in-app when your agent is ready."}
            {channel === 'whatsapp' && `Your agent will reach you on WhatsApp at ${contactNumber}.`}
            {channel === 'phone_call' && `Your agent will call you at ${contactNumber}.`}
          </p>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Submit Another Errand
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subscription badge */}
      {isSubscribed && canUseForFree && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-600" />
              <span className="font-medium text-emerald-700">Included in your plan</span>
              <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-300">
                {remaining === 'unlimited' ? 'Unlimited' : `${remaining} left`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">📦 Request an Errand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* 1. Channel Preference */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">How should the agent reach you?</Label>
            <RadioGroup value={channel} onValueChange={setChannel} className="grid grid-cols-3 gap-2">
              {CHANNEL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all text-center ${
                    channel === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="sr-only" />
                  <opt.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </label>
              ))}
            </RadioGroup>
            {needsContact && (
              <Input
                placeholder="e.g. 0712 345 678"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* 2. Errand Type */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">What type of errand?</Label>
            <Select value={errandType} onValueChange={setErrandType}>
              <SelectTrigger><SelectValue placeholder="Select errand type..." /></SelectTrigger>
              <SelectContent>
                {ERRAND_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Location Scope */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Where?</Label>
            <RadioGroup value={locationScope} onValueChange={setLocationScope} className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                locationScope === 'within_estate' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}>
                <RadioGroupItem value="within_estate" className="sr-only" />
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-sm font-medium">Within Estate</span>
                  <p className="text-[10px] text-muted-foreground">Base price only</p>
                </div>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                locationScope === 'nairobi_wide' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}>
                <RadioGroupItem value="nairobi_wide" className="sr-only" />
                <MapPin className="w-4 h-4 text-orange-500" />
                <div>
                  <span className="text-sm font-medium">Anywhere in Nairobi</span>
                  <p className="text-[10px] text-muted-foreground">+KSh 100 top-up</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* 4. Description */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Describe your errand</Label>
            <Textarea
              placeholder="e.g. Please go to Quickmart on Ngong Road and buy 2kg sugar, 1L cooking oil (Elianto), and a loaf of Broadways bread. Use M-Pesa to pay — I'll send you KSh 500 float."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* 5. House Number */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Your Location
            </Label>
            <Input
              placeholder="e.g. Block A, House 12"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
            />
            {currentApartment && currentApartment.id !== 'general-location' && (
              <p className="text-xs text-muted-foreground">📍 {currentApartment.name}</p>
            )}
          </div>

          {/* 6. Urgency */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> When do you need this?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    urgency === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={opt.value}
                    checked={urgency === opt.value}
                    onChange={() => setUrgency(opt.value)}
                    className="sr-only"
                  />
                  <span>{opt.badge}</span>
                  <span className="text-xs font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            {urgency === 'schedule' && (
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-2"
              />
            )}
          </div>

          {/* Pricing Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-medium text-amber-800 text-sm flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5" /> Pricing
            </h4>
            <p className="text-xs text-amber-700">
              Base price: <strong>KSh 100</strong>. 
              {locationScope === 'nairobi_wide' && <> Distance top-up: <strong>+KSh 100</strong>. </>}
              If your errand involves buying items, you'll send the agent M-Pesa float for the purchase. 
              You only pay the service fee + item cost.
            </p>
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Service Fee</span>
              <div className="text-right">
                {canUseForFree ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-600">Free</span>
                    <span className="text-sm text-muted-foreground line-through">KSh {basePrice + distanceTopUp}</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold">KSh {totalPrice}</span>
                )}
              </div>
            </div>
            {distanceTopUp > 0 && !canUseForFree && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Includes KSh 100 distance top-up</p>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : canUseForFree ? 'Request Errand (Free)' : `Request Errand — KSh ${totalPrice}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
