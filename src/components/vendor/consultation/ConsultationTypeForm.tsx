import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ConsultationType, ConsultationTypeFormData } from '@/types/consultation';
import { Loader2, Stethoscope } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.coerce.number().min(15).max(60),
  price: z.coerce.number().min(0),
  requires_prescription: z.boolean(),
  is_active: z.boolean(),
});

interface ConsultationTypeFormProps {
  initialData?: ConsultationType;
  onSubmit: (data: ConsultationTypeFormData) => Promise<void>;
  onCancel: () => void;
}

export function ConsultationTypeForm({ initialData, onSubmit, onCancel }: ConsultationTypeFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ConsultationTypeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      duration_minutes: [15, 30, 45, 60].includes(initialData?.duration_minutes ?? -1)
        ? (initialData?.duration_minutes as 15 | 30 | 45 | 60)
        : 30,
      price: initialData?.price || 0,
      requires_prescription: initialData?.requires_prescription || false,
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleSubmit = async (data: ConsultationTypeFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-full">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Consultation Type' : 'Create Consultation Type'}
          </h3>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consultation Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., General Health Consultation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this consultation covers..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Help customers understand what to expect from this consultation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Slider
                      value={[field.value]}
                      min={15}
                      max={60}
                      step={15}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {[15, 30, 45, 60].map((m) => (
                        <span key={m} className={m === field.value ? 'text-foreground font-medium' : undefined}>
                          {m}m
                        </span>
                      ))}
                    </div>
                    <div className="text-sm">
                      Selected: <span className="font-medium">{field.value} minutes</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (KSh)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="requires_prescription"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Requires Prescription</FormLabel>
                  <FormDescription>
                    Enable if this consultation may result in prescription medications.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Inactive consultation types won't be visible to customers.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
