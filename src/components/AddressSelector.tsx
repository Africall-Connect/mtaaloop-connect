import React, { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAddress } from '@/contexts/AddressContext';
import { Address } from '@/types/database';
import { toast } from 'sonner';

interface AddressSelectorProps {
  selectedAddress?: Address | null;
  onAddressSelect?: (address: Address) => void;
  showAddNew?: boolean;
  compact?: boolean;
}

const AddressForm: React.FC<{
  address?: Address;
  onSave: (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}> = ({ address, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    label: address?.label || '',
    estate_name: address?.estate_name || '',
    phase_block: address?.phase_block || '',
    house_number: address?.house_number || '',
    street_address: address?.street_address || '',
    city: address?.city || 'Nairobi',
    county: address?.county || 'Nairobi',
    postal_code: address?.postal_code || '',
    is_default: address?.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="label">Label *</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Home, Office, etc."
            required
          />
        </div>
        <div>
          <Label htmlFor="estate_name">Estate Name *</Label>
          <Input
            id="estate_name"
            value={formData.estate_name}
            onChange={(e) => setFormData(prev => ({ ...prev, estate_name: e.target.value }))}
            placeholder="Riara Heights, Kilimani, etc."
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phase_block">Phase/Block</Label>
          <Input
            id="phase_block"
            value={formData.phase_block}
            onChange={(e) => setFormData(prev => ({ ...prev, phase_block: e.target.value }))}
            placeholder="Phase 2, Block A, etc."
          />
        </div>
        <div>
          <Label htmlFor="house_number">House Number</Label>
          <Input
            id="house_number"
            value={formData.house_number}
            onChange={(e) => setFormData(prev => ({ ...prev, house_number: e.target.value }))}
            placeholder="B204, Villa 15, etc."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="street_address">Street Address</Label>
        <Input
          id="street_address"
          value={formData.street_address}
          onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
          placeholder="Riara Road, Ngong Road, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="county">County</Label>
          <Input
            id="county"
            value={formData.county}
            onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="postal_code">Postal Code</Label>
        <Input
          id="postal_code"
          value={formData.postal_code}
          onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
          placeholder="00100"
          pattern="\d{5}"
          title="5-digit postal code"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="is_default" className="text-sm cursor-pointer">
          Set as default address
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {address ? 'Update' : 'Add'} Address
        </Button>
      </div>
    </form>
  );
};

const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedAddress: propSelectedAddress,
  onAddressSelect,
  showAddNew = true,
  compact = false,
}) => {
  const { addresses, selectedAddress: contextSelectedAddress, setSelectedAddress, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddress();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const currentSelected = propSelectedAddress || contextSelectedAddress;

  const handleAddressSelect = (address: Address) => {
    if (onAddressSelect) {
      onAddressSelect(address);
    } else {
      setSelectedAddress(address);
    }
  };

  const handleAddAddress = async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await addAddress(addressData);
    setIsAddDialogOpen(false);
  };

  const handleUpdateAddress = async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingAddress) {
      await updateAddress(editingAddress.id, addressData);
      setEditingAddress(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(addressId);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    await setDefaultAddress(addressId);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Delivery Address</Label>
        {addresses.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">No delivery address set</p>
            {showAddNew && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Delivery Address</DialogTitle>
                  </DialogHeader>
                  <AddressForm
                    onSave={handleAddAddress}
                    onCancel={() => setIsAddDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <>
            <RadioGroup
              value={currentSelected?.id || ''}
              onValueChange={(value) => {
                const address = addresses.find(addr => addr.id === value);
                if (address) handleAddressSelect(address);
              }}
            >
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value={address.id} id={address.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={address.id} className="font-medium cursor-pointer text-sm">
                        {address.estate_name}
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
            {showAddNew && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Change Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Address</DialogTitle>
                  </DialogHeader>
                  <AddressForm
                    address={addresses[0]}
                    onSave={(data) => handleUpdateAddress(data)}
                    onCancel={() => setIsAddDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Delivery Address</h3>
        {showAddNew && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <AddressForm
                onSave={handleAddAddress}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className={`p-4 cursor-pointer transition-colors ${
              currentSelected?.id === address.id
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleAddressSelect(address)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{address.label}</h4>
                    {address.is_default && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {address.estate_name}
                    {address.phase_block && `, ${address.phase_block}`}
                    {address.house_number && `, ${address.house_number}`}
                    <br />
                    {address.street_address && `${address.street_address}, `}
                    {address.city}, {address.county}
                    {address.postal_code && ` ${address.postal_code}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAddress(address);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(address.id);
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(address.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Address Dialog */}
      <Dialog open={!!editingAddress} onOpenChange={() => setEditingAddress(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <AddressForm
              address={editingAddress}
              onSave={handleUpdateAddress}
              onCancel={() => setEditingAddress(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressSelector;
