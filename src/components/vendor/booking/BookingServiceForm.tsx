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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { BookingServiceType, DURATION_OPTIONS } from '@/types/booking';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Radix Select works best when values are stable/unique.
  // Using IDs prevents issues where multiple options share the same name,
  // and fixes "stuck" selects caused by value mismatches.
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategoryId, setSubcategoryId] = useState<string>('');

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  // Reset form when dialog opens/closes or service changes
  useEffect(() => {
    if (open && service) {
      setName(service.name);
      setDescription(service.description || '');
      setDurationMinutes(service.duration_minutes);
      setPrice(service.price.toString());
      setCategory(service.category || '');
      setSubcategory(service.subcategory || '');

      // Try to derive IDs from the provided lists (best-effort)
      const matchedCat = categories.find(c => c.name === (service.category || ''));
      setCategoryId(matchedCat?.id || '');
      const matchedSub = subcategories.find(s => s.name === (service.subcategory || ''));
      setSubcategoryId(matchedSub?.id || '');

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
      setCategoryId('');
      setSubcategoryId('');
      setRequiresAddress(false);
      setIsActive(true);
    }
  }, [open, service, categories, subcategories]);

  const filteredSubcategories = subcategories.filter(
    sub => sub.category_id === categoryId
  );

  const selectedCategoryName = categories.find(c => c.id === categoryId)?.name || '';
  const selectedSubcategoryName = filteredSubcategories.find(s => s.id === subcategoryId)?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      name,
      description: description || null,
      duration_minutes: durationMinutes,
      price: parseFloat(price),
      // Keep storing names (schema expectation), but drive UI by IDs.
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
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                  >
                    {selectedCategoryName || 'Select category...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search category..." />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => {
                              setCategoryId(cat.id);
                              setCategory(cat.name);
                              // Reset subcategory when category changes
                              setSubcategoryId('');
                              setSubcategory('');
                              setCategoryOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', categoryId === cat.id ? 'opacity-100' : 'opacity-0')} />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Popover open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={subcategoryOpen}
                    className="w-full justify-between"
                    disabled={!categoryId}
                  >
                    {selectedSubcategoryName || (categoryId ? 'Select subcategory...' : 'Select category first')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search subcategory..." />
                    <CommandList>
                      <CommandEmpty>No subcategory found.</CommandEmpty>
                      <CommandGroup>
                        {filteredSubcategories.map((sub) => (
                          <CommandItem
                            key={sub.id}
                            value={sub.name}
                            onSelect={() => {
                              setSubcategoryId(sub.id);
                              setSubcategory(sub.name);
                              setSubcategoryOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', subcategoryId === sub.id ? 'opacity-100' : 'opacity-0')} />
                            {sub.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
