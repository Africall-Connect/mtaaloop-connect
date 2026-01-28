import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Edit, Plus, Store, ShoppingBag, Heart, Share2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const Cart = () => {
  const {
    vendorGroups,
    savedItems,
    selectedItems,
    removeItem,
    updateQuantity,
    clearVendorCart,
    saveForLater,
    moveToCart,
    removeFromSaved,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    bulkRemoveSelected,
    bulkSaveSelected,
    generateShareLink,
    getSelectedCount
  } = useCart();

  const handleShareCart = async () => {
    const shareLink = generateShareLink();
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Cart link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (vendorGroups.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">Add some delicious items to get started!</p>
          <Link to="/">
            <Button>Browse Vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">🛒 Your Cart</h1>
          </div>

          {/* Bulk Actions */}
          {getSelectedCount() > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{getSelectedCount()} selected</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkSaveSelected}
                className="text-orange-600"
              >
                <Heart className="w-4 h-4 mr-2" />
                Save for Later
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={bulkRemoveSelected}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Selected
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
          )}

          {/* Share Cart */}
          <Button variant="outline" onClick={handleShareCart}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Cart
          </Button>
        </div>

        <div className="space-y-6">
          {/* Saved Items Section */}
          {savedItems.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-orange-600" />
                  Saved for Later ({savedItems.length})
                </h2>
              </div>

              <div className="space-y-3">
                {savedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    {item.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">From {item.vendorName}</p>
                      <p className="text-sm font-medium text-primary">KSh {item.price}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveToCart(item.id)}
                        className="text-primary"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Move to Cart
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromSaved(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Vendor Groups */}
          {vendorGroups.map((group, groupIndex) => {
            const actualDeliveryFee = group.deliveryFee;
            const groupTotal = group.subtotal + actualDeliveryFee;
            const loyaltyPoints = Math.floor(groupTotal / 50);

            return (
              <div key={group.vendorId} className="space-y-4">
                {/* Vendor Header */}
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-bold text-lg">{group.vendorName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.items.length} item{group.items.length !== 1 ? 's' : ''} •
                          Minimum order: KSh {group.minimumOrder}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearVendorCart(group.vendorId)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </Card>

                {/* Items for this vendor */}
                {group.items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="mt-1"
                      />

                      {item.image && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">From {item.vendorName}</p>

                        {item.customizations && (
                          <div className="text-sm text-muted-foreground space-y-1">
                            {item.customizations.spiceLevel && (
                              <div>• {item.customizations.spiceLevel} spice</div>
                            )}
                            {item.customizations.protein?.map((p) => <div key={p}>• {p}</div>)}
                            {item.customizations.sides?.map((s) => <div key={s}>• {s}</div>)}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2 border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>

                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveForLater(item.id)}
                            className="text-orange-600"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Save for Later
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          KSh {item.price * item.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          KSh {item.price} each
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Summary for this vendor */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Summary - {group.vendorName}</h2>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({group.items.length} items)</span>
                      <span>KSh {group.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>
                        KSh {group.deliveryFee}
                      </span>
                    </div>
                    {/* Free delivery message removed per requirement */}
                  </div>

                  <div className="pt-4 border-t flex justify-between items-center mb-4">
                    <span className="text-xl font-bold">TOTAL</span>
                    <span className="text-2xl font-bold text-primary">KSh {groupTotal}</span>
                  </div>

                  {/* Loyalty points prompt removed from cart page per requirement */}

                  <Link to="/checkout">
                    <Button className="w-full" size="lg">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Checkout {group.vendorName}
                    </Button>
                  </Link>
                </Card>

                {/* Separator between vendors */}
                {groupIndex < vendorGroups.length - 1 && <Separator className="my-8" />}
              </div>
            );
          })}


        </div>
      </div>
    </div>
  );
};

export default Cart;
