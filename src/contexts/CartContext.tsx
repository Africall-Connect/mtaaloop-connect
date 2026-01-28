import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  customizations?: {
    spiceLevel?: string;
    protein?: string[];
    sides?: string[];
    instructions?: string;
  };
  bookingDetails?: {
    slot_start: string;
    slot_end: string;
  };
}

export interface CartVendorGroup {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  minimumOrder?: number;
}

interface CartContextType {
  items: CartItem[];
  savedItems: CartItem[];
  selectedItems: Set<string>;
  vendorGroups: CartVendorGroup[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeFromSaved: (id: string) => void;
  toggleItemSelection: (id: string) => void;
  selectAllItems: (vendorId?: string) => void;
  clearSelection: () => void;
  bulkRemoveSelected: () => void;
  bulkSaveSelected: () => void;
  generateShareLink: () => string;
  loadSharedCart: (sharedItems: CartItem[]) => void;
  clearVendorCart: (vendorId: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  getVendorTotal: (vendorId: string) => number;
  getVendorItemCount: (vendorId: string) => number;
  getSelectedCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("mtaalopp_cart");
    const savedForLater = localStorage.getItem("mtaalopp_saved");

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
      }
    }

    if (savedForLater) {
      try {
        setSavedItems(JSON.parse(savedForLater));
      } catch (error) {
        console.error("Failed to load saved items from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("mtaalopp_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("mtaalopp_saved", JSON.stringify(savedItems));
  }, [savedItems]);

  // Group items by vendor
  const vendorGroups = items.reduce((groups, item) => {
    const existingGroup = groups.find(g => g.vendorId === item.vendorId);
    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.subtotal += item.price * item.quantity;
    } else {
      groups.push({
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        items: [item],
        subtotal: item.price * item.quantity,
        deliveryFee: 50, // Default delivery fee
        minimumOrder: 200, // Default minimum order
      });
    }
    return groups;
  }, [] as CartVendorGroup[]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // For bookings, ensure they are unique and not stacked
      if (item.bookingDetails) {
        const existingIndex = prev.findIndex((i) => i.id === item.id);
        if (existingIndex > -1) {
          // Replace existing booking with new one if details are different, otherwise do nothing
          if (JSON.stringify(prev[existingIndex].bookingDetails) !== JSON.stringify(item.bookingDetails)) {
            const updated = [...prev];
            updated[existingIndex] = item;
            return updated;
          }
          return prev;
        }
        return [...prev, { ...item, quantity: 1 }];
      }

      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setSelectedItems(new Set());
  };

  const saveForLater = (id: string) => {
    const itemToSave = items.find(item => item.id === id);
    if (itemToSave) {
      setSavedItems(prev => [...prev, itemToSave]);
      removeItem(id);
    }
  };

  const moveToCart = (id: string) => {
    const itemToMove = savedItems.find(item => item.id === id);
    if (itemToMove) {
      addItem(itemToMove);
      setSavedItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const removeFromSaved = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllItems = (vendorId?: string) => {
    const itemsToSelect = vendorId
      ? items.filter(item => item.vendorId === vendorId)
      : items;
    setSelectedItems(new Set(itemsToSelect.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const bulkRemoveSelected = () => {
    setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const bulkSaveSelected = () => {
    const itemsToSave = items.filter(item => selectedItems.has(item.id));
    setSavedItems(prev => [...prev, ...itemsToSave]);
    setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const generateShareLink = () => {
    const shareData = {
      items: items.map(item => ({
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        customizations: item.customizations,
      })),
      timestamp: Date.now(),
    };

    const encodedData = btoa(JSON.stringify(shareData));
    return `${window.location.origin}/shared-cart/${encodedData}`;
  };

  const loadSharedCart = (sharedItems: CartItem[]) => {
    // Merge shared items with existing cart
    setItems(prev => {
      const merged = [...prev];
      sharedItems.forEach(sharedItem => {
        const existingIndex = merged.findIndex(item => item.id === sharedItem.id);
        if (existingIndex > -1) {
          merged[existingIndex].quantity += sharedItem.quantity;
        } else {
          merged.push(sharedItem);
        }
      });
      return merged;
    });
  };

  const clearVendorCart = (vendorId: string) => {
    setItems((prev) => prev.filter((item) => item.vendorId !== vendorId));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      items.filter(item => item.vendorId === vendorId).forEach(item => newSet.delete(item.id));
      return newSet;
    });
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getVendorTotal = (vendorId: string) => {
    return items
      .filter(item => item.vendorId === vendorId)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getVendorItemCount = (vendorId: string) => {
    return items
      .filter(item => item.vendorId === vendorId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSelectedCount = () => {
    return selectedItems.size;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        savedItems,
        selectedItems,
        vendorGroups,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        saveForLater,
        moveToCart,
        removeFromSaved,
        toggleItemSelection,
        selectAllItems,
        clearSelection,
        bulkRemoveSelected,
        bulkSaveSelected,
        generateShareLink,
        loadSharedCart,
        clearVendorCart,
        getTotal,
        getItemCount,
        getVendorTotal,
        getVendorItemCount,
        getSelectedCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
