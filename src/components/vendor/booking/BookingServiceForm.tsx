import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingServiceType, DURATION_OPTIONS } from '@/types/booking';
import { Loader2 } from 'lucide-react';

interface BookingServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: BookingServiceType | null;
  categories?: { id: string; name: string; slug: string }[];
  subcategories?: { id: string; name: string; category_id: string }[];
  onSubmit: (data: Partial<BookingServiceType>) => Promise<void>;
  loading?: boolean;
}

export function BookingServiceForm({
  open,
  onOpenChange,
  service,
  categories = [],
  subcategories = [],
  onSubmit,
  loading,
}: BookingServiceFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [requiresAddress, setRequiresAddress] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Reset form when dialog opens/closes or service changes
  useEffect(() => {
    if (open && service) {
      setName(service.name);
      setDescription(service.description || '');
      setDurationMinutes(service.duration_minutes);
      setPrice(service.price.toString());
      setCategory(service.category || '');
      setSubcategory(service.subcategory || '');
      setRequiresAddress(service.requires_address);
      setIsActive(service.is_active);
    } else if (open) {
      // Reset to defaults for new service
      setName('');
      setDescription('');
      setDurationMinutes(60);
      setPrice('');
      setCategory('');
      setSubcategory('');
      setRequiresAddress(false);
      setIsActive(true);
    }
  }, [open, service]);

  const filteredSubcategories = subcategories.filter(
    sub => categories.find(cat => cat.name === category)?.id === sub.category_id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      name,
      description: description || null,
      duration_minutes: durationMinutes,
      price: parseFloat(price),
      category: category || null,
      subcategory: subcategory || null,
      requires_address: requiresAddress,
      is_active: isActive,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Edit Service' : 'Add New Service'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Full Body Massage"
              required
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(val) => { setCategory(val); setSubcategory(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubcategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your service..."
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={durationMinutes.toString()} onValueChange={(val) => setDurationMinutes(parseInt(val))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (KES) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Requires Customer Address</Label>
                <p className="text-xs text-muted-foreground">For home visits or deliveries</p>
              </div>
              <Switch
                checked={requiresAddress}
                onCheckedChange={setRequiresAddress}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Show this service to customers</p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name || !price}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {service ? 'Update Service' : 'Add Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
