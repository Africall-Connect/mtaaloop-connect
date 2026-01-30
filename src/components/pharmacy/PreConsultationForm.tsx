import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  PreConsultationFormData,
  CHRONIC_CONDITIONS,
  SYMPTOM_DURATIONS,
  AGE_GROUPS,
} from '@/types/consultation';
import { AlertTriangle, Pill, FileText } from 'lucide-react';

const formSchema = z.object({
  symptoms: z.string().min(10, 'Please describe your symptoms in more detail'),
  symptom_duration: z.string().min(1, 'Please select symptom duration'),
  has_allergies: z.boolean(),
  allergies_details: z.string().optional(),
  has_chronic_conditions: z.boolean(),
  chronic_conditions: z.array(z.string()).optional(),
  current_medications: z.string().optional(),
  is_pregnant: z.boolean(),
  is_breastfeeding: z.boolean(),
  age_group: z.enum(['infant', 'child', 'teen', 'adult', 'senior']),
  additional_notes: z.string().optional(),
});

interface PreConsultationFormProps {
  onSubmit: (data: PreConsultationFormData) => void;
  onBack: () => void;
}

export function PreConsultationForm({ onSubmit, onBack }: PreConsultationFormProps) {
  const form = useForm<PreConsultationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: '',
      symptom_duration: '',
      has_allergies: false,
      allergies_details: '',
      has_chronic_conditions: false,
      chronic_conditions: [],
      current_medications: '',
      is_pregnant: false,
      is_breastfeeding: false,
      age_group: 'adult',
      additional_notes: '',
    },
  });

  const hasAllergies = form.watch('has_allergies');
  const hasChronicConditions = form.watch('has_chronic_conditions');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Pre-Consultation Information</h3>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          This information helps the pharmacist prepare for your consultation and provide 
          better care. All information is kept confidential.
        </div>

        {/* Symptoms */}
        <FormField
          control={form.control}
          name="symptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What symptoms are you experiencing? *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your symptoms in detail..."
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="symptom_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How long have you had these symptoms? *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SYMPTOM_DURATIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age_group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age Group *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AGE_GROUPS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Allergies */}
        <div className="space-y-4 p-4 border rounded-lg">
          <FormField
            control={form.control}
            name="has_allergies"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <FormLabel className="!mt-0">I have known allergies</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {hasAllergies && (
            <FormField
              control={form.control}
              name="allergies_details"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="List your allergies (e.g., Penicillin, Aspirin)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="space-y-4 p-4 border rounded-lg">
          <FormField
            control={form.control}
            name="has_chronic_conditions"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">I have chronic conditions</FormLabel>
              </FormItem>
            )}
          />
          
          {hasChronicConditions && (
            <FormField
              control={form.control}
              name="chronic_conditions"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CHRONIC_CONDITIONS.map(condition => (
                      <Label
                        key={condition}
                        className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={field.value?.includes(condition)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, condition]);
                            } else {
                              field.onChange(current.filter(c => c !== condition));
                            }
                          }}
                        />
                        <span className="text-sm">{condition}</span>
                      </Label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Current Medications */}
        <FormField
          control={form.control}
          name="current_medications"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <FormLabel>Current Medications (if any)</FormLabel>
              </div>
              <FormControl>
                <Textarea
                  placeholder="List any medications you are currently taking..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include prescription drugs, over-the-counter medications, and supplements
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pregnancy/Breastfeeding */}
        <div className="flex flex-wrap gap-6">
          <FormField
            control={form.control}
            name="is_pregnant"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">I am pregnant</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="is_breastfeeding"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">I am breastfeeding</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="additional_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any other information you'd like to share..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Continue to Confirmation
          </Button>
        </div>
      </form>
    </Form>
  );
}
