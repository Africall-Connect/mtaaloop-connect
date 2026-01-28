import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Home, Briefcase, Star, Edit, Trash2, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeliveryAddress {
  id: string;
  user_id: string;
  estate_id: string | null;
  address_type: "home" | "work" | "other";
  label: string;
  building_name: string | null;
  floor_number: string | null;
  unit_number: string | null;
  additional_directions: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface Estate {
  id: string;
  name: string;
  location: string;
}

const Addresses = () => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    estate_id: "",
    address_type: "home" as "home" | "work" | "other",
    label: "",
    building_name: "",
    floor_number: "",
    unit_number: "",
    additional_directions: "",
    is_default: false,
  });

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please log in to view addresses",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("delivery_addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchEstates = async () => {
    try {
      const { data, error } = await supabase
        .from("estates")
        .select("id, name, location")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setEstates(data || []);
    } catch (error) {
      console.error("Error fetching estates:", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchEstates();
  }, [fetchAddresses]);

  const openAddDialog = () => {
    setEditingAddress(null);
    setFormData({
      estate_id: "",
      address_type: "home",
      label: "",
      building_name: "",
      floor_number: "",
      unit_number: "",
      additional_directions: "",
      is_default: addresses.length === 0, // First address is default
    });
    setDialogOpen(true);
  };

  const openEditDialog = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setFormData({
      estate_id: address.estate_id || "",
      address_type: address.address_type,
      label: address.label,
      building_name: address.building_name || "",
      floor_number: address.floor_number || "",
      unit_number: address.unit_number || "",
      additional_directions: address.additional_directions || "",
      is_default: address.is_default,
    });
    setDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.estate_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const addressData = {
        user_id: user.id,
        estate_id: formData.estate_id || null,
        address_type: formData.address_type,
        label: formData.label,
        building_name: formData.building_name || null,
        floor_number: formData.floor_number || null,
        unit_number: formData.unit_number || null,
        additional_directions: formData.additional_directions || null,
        is_default: formData.is_default,
        is_active: true,
      };

      // If this is being set as default, unset all other defaults first
      if (formData.is_default) {
        await supabase
          .from("delivery_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from("delivery_addresses")
          .update(addressData)
          .eq("id", editingAddress.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Address updated successfully",
        });
      } else {
        // Create new address
        const { error } = await supabase
          .from("delivery_addresses")
          .insert(addressData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Address added successfully",
        });
      }

      setDialogOpen(false);
      await fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      // Unset all defaults
      await supabase
        .from("delivery_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("delivery_addresses")
        .update({ is_default: true })
        .eq("id", addressId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default address updated",
      });

      await fetchAddresses();
    } catch (error) {
      console.error("Error setting default:", error);
      toast({
        title: "Error",
        description: "Failed to set default address",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      setDeleting(true);

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("delivery_addresses")
        .update({ is_active: false })
        .eq("id", addressToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      await fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return Home;
      case "work":
        return Briefcase;
      default:
        return MapPin;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">📍 Saved Addresses</h1>
        </div>

        <Button className="w-full mb-6" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>

        {addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No addresses saved yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first delivery address to get started
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => {
              const Icon = getAddressIcon(addr.address_type);
              const estate = estates.find(e => e.id === addr.estate_id);
              
              return (
                <Card key={addr.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{addr.label}</h3>
                          {addr.is_default && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {addr.address_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {estate && <p className="font-medium">{estate.name}</p>}
                          {addr.building_name && <p>Building: {addr.building_name}</p>}
                          {(addr.floor_number || addr.unit_number) && (
                            <p>
                              {addr.floor_number && `Floor ${addr.floor_number}`}
                              {addr.floor_number && addr.unit_number && ", "}
                              {addr.unit_number && `Unit ${addr.unit_number}`}
                            </p>
                          )}
                          {addr.additional_directions && (
                            <p className="text-xs">{addr.additional_directions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(addr)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddressToDelete(addr.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {!addr.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for your delivery address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="estate">Estate/Building *</Label>
              <Select
                value={formData.estate_id}
                onValueChange={(value) => setFormData({ ...formData, estate_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select estate" />
                </SelectTrigger>
                <SelectContent>
                  {estates.map((estate) => (
                    <SelectItem key={estate.id} value={estate.id}>
                      {estate.name} - {estate.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address_type">Address Type</Label>
              <Select
                value={formData.address_type}
                onValueChange={(value: "home" | "work" | "other") => setFormData({ ...formData, address_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="other">📍 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="label">Address Label *</Label>
              <Input
                id="label"
                placeholder="e.g., My Apartment, Office"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="building_name">Building Name</Label>
              <Input
                id="building_name"
                placeholder="e.g., Tower A, Block 3"
                value={formData.building_name}
                onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floor_number">Floor</Label>
                <Input
                  id="floor_number"
                  placeholder="e.g., 5"
                  value={formData.floor_number}
                  onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit_number">Unit/Apt #</Label>
                <Input
                  id="unit_number"
                  placeholder="e.g., 5B"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="directions">Additional Directions</Label>
              <Textarea
                id="directions"
                placeholder="e.g., Near the elevator, blue door..."
                value={formData.additional_directions}
                onChange={(e) => setFormData({ ...formData, additional_directions: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default address
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAddress} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Address</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAddress}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Addresses;
