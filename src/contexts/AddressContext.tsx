import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Address } from '@/types/database';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddressContextType {
  addresses: Address[];
  selectedAddress: Address | null;
  loading: boolean;
  addAddress: (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setSelectedAddress: (address: Address | null) => void;
  setDefaultAddress: (id: string) => Promise<void>;
  validateAddress: (address: Partial<Address>) => { isValid: boolean; errors: string[] };
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};

interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAddressesFromDatabase();
    }
  }, [user]);

  const loadAddressesFromDatabase = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user preferences to get apartment_name
      const { data: userPrefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('apartment_name')
        .eq('user_id', user.id)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', prefsError);
      }

      // If apartment_name exists, create an address from it
      if (userPrefs?.apartment_name) {
        const apartmentAddress: Address = {
          id: '1',
          user_id: user.id,
          label: 'Home',
          estate_name: userPrefs.apartment_name,
          phase_block: '',
          house_number: '',
          street_address: '',
          city: 'Nairobi',
          county: 'Nairobi',
          postal_code: '',
          latitude: null,
          longitude: null,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setAddresses([apartmentAddress]);
        setSelectedAddress(apartmentAddress);
      } else {
        // No apartment_name set, show empty addresses
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = (address: Partial<Address>) => {
    const errors: string[] = [];

    if (!address.label?.trim()) errors.push('Label is required');
    if (!address.estate_name?.trim()) errors.push('Estate name is required');
    if (!address.city?.trim()) errors.push('City is required');

    // Basic validation for Kenyan addresses
    if (address.postal_code && !/^\d{5}$/.test(address.postal_code)) {
      errors.push('Postal code must be 5 digits');
    }

    return { isValid: errors.length === 0, errors };
  };

  const addAddress = async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const validation = validateAddress(addressData);
    if (!validation.isValid) {
      toast.error(`Invalid address: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      // Update user_preferences with the apartment_name
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          apartment_name: addressData.estate_name,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Reload addresses from database
      await loadAddressesFromDatabase();
      
      toast.success('Address added successfully');
    } catch (error) {
      toast.error('Failed to add address');
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id: string, addressData: Partial<Address>) => {
    if (!user) return;
    
    const validation = validateAddress(addressData);
    if (!validation.isValid) {
      toast.error(`Invalid address: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      // Update user_preferences with the new apartment_name
      const { error } = await supabase
        .from('user_preferences')
        .update({
          apartment_name: addressData.estate_name,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload addresses from database
      await loadAddressesFromDatabase();

      toast.success('Address updated successfully');
    } catch (error) {
      toast.error('Failed to update address');
      console.error('Error updating address:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) return;
    
    try {
      // Clear apartment_name from user_preferences
      const { error } = await supabase
        .from('user_preferences')
        .update({
          apartment_name: null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload addresses from database
      await loadAddressesFromDatabase();

      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error('Failed to delete address');
      console.error('Error deleting address:', error);
    }
  };

  const setDefaultAddress = async (id: string) => {
    // Since we only have one address from user_preferences, this is already the default
    // No action needed
    toast.info('This is already your default address');
  };

  const value: AddressContextType = {
    addresses,
    selectedAddress,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    setSelectedAddress,
    setDefaultAddress,
    validateAddress,
  };

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};
