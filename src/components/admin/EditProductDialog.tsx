import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface SupermarketItem {
  id: string;
  product_name: string;
  markup_price: number;
  image_url: string;
  in_stock: boolean;
}

interface EditProductDialogProps {
  item: SupermarketItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: SupermarketItem) => void;
}

const EditProductDialog = ({ item, isOpen, onClose, onSave }: EditProductDialogProps) => {
  const [editedItem, setEditedItem] = useState(item);

  const handleInputChange = (field: keyof SupermarketItem, value: string | number | boolean) => {
    setEditedItem(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const { error } = await supabase
        .from("big_supermarket_items")
        .update({
          product_name: editedItem.product_name,
          image_url: editedItem.image_url,
          markup_price: editedItem.markup_price,
          in_stock: editedItem.in_stock,
        })
        .eq("id", editedItem.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Item updated successfully.",
      });
      onSave(editedItem);
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: `Failed to update item: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {item.product_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={editedItem.product_name}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="markup_price">Markup Price</Label>
            <Input
              id="markup_price"
              type="number"
              value={editedItem.markup_price}
              onChange={(e) => handleInputChange('markup_price', parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={editedItem.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="in_stock"
              checked={editedItem.in_stock}
              onCheckedChange={(checked) => handleInputChange('in_stock', checked)}
            />
            <Label htmlFor="in_stock">In Stock</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
