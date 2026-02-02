import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Edit, Plus, Store, ShoppingBag, Heart, Share2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const Cart = () => {
  const isMobile = useIsMobile();
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
            <ShoppingBag className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Add some delicious items to get started!</p>
          <Link to="/">
            <Button className="gap-2">Browse Vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container px-4 py-4 sm:py-6 max-w-4xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="touch-target">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold">Your Cart</h1>
            </div>
          </div>

          {/* Share Cart - Icon only on mobile */}
          <Button 
            variant="outline" 
            onClick={handleShareCart}
            size={isMobile ? "icon" : "default"}
            className="touch-target"
          >
            <Share2 className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Share Cart</span>}
          </Button>
        </div>

        {/* Bulk Actions Bar - Mobile Optimized */}
        {getSelectedCount() > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg flex-wrap">
            <Badge variant="secondary" className="shrink-0">{getSelectedCount()} selected</Badge>
            
            {isMobile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <MoreVertical className="h-4 w-4 mr-1" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={bulkSaveSelected} className="text-orange-600">
                    <Heart className="w-4 h-4 mr-2" />
                    Save for Later
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={bulkRemoveSelected} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearSelection}>
                    Clear Selection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2 ml-auto">
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
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Saved Items Section */}
          {savedItems.length > 0 && (
            <Card className="p-4 sm:p-6 border-dashed border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-full">
                    <Heart className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    Saved for Later ({savedItems.length})
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {savedItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">From {item.vendorName}</p>
                        <p className="text-sm font-medium text-primary">KSh {item.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveToCart(item.id)}
                        className="text-primary flex-1 sm:flex-none"
                      >
                        <ShoppingBag className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Move to Cart</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromSaved(item.id)}
                        className="text-destructive touch-target"
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

            return (
              <div key={group.vendorId} className="space-y-3 sm:space-y-4">
                {/* Vendor Header */}
                <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Store className="w-5 h-5 text-primary shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base sm:text-lg truncate">{group.vendorName}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {group.items.length} item{group.items.length !== 1 ? 's' : ''} •
                          Min: KSh {group.minimumOrder}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size={isMobile ? "icon" : "sm"}
                      onClick={() => clearVendorCart(group.vendorId)}
                      className="text-destructive shrink-0 touch-target"
                    >
                      <Trash2 className="w-4 h-4" />
                      {!isMobile && <span className="ml-2">Clear All</span>}
                    </Button>
                  </div>
                </Card>

                {/* Items for this vendor - Mobile Optimized */}
                {group.items.map((item) => (
                  <Card key={item.id} className="p-3 sm:p-4 border-l-4 border-l-primary/20 hover:shadow-md transition-shadow">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="mt-1 touch-target"
                      />

                      {item.image && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base truncate">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">From {item.vendorName}</p>
                          </div>
                          {/* Price - Visible on top right for mobile */}
                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-xl font-bold text-primary">
                              KSh {(item.price * item.quantity).toLocaleString()}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-muted-foreground">
                                KSh {item.price.toLocaleString()} each
                              </div>
                            )}
                          </div>
                        </div>

                        {item.customizations && (
                          <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                            {item.customizations.spiceLevel && (
                              <div>• {item.customizations.spiceLevel} spice</div>
                            )}
                            {item.customizations.protein?.slice(0, 2).map((p) => <div key={p}>• {p}</div>)}
                          </div>
                        )}

                        {/* Quantity and Actions Row */}
                        <div className="flex items-center gap-2 sm:gap-4 mt-3 flex-wrap">
                          <div className="flex items-center gap-1 border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="font-medium w-6 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>

                          {/* Action buttons - Icons only on mobile */}
                          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600"
                              onClick={() => saveForLater(item.id)}
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Summary for this vendor */}
                <Card className="p-4 sm:p-6 border-t-4 border-t-primary">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">Order Summary - {group.vendorName}</h2>

                  <div className="space-y-2 mb-4 text-sm sm:text-base">
                    <div className="flex justify-between">
                      <span>Subtotal ({group.items.length} items)</span>
                      <span>KSh {group.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>KSh {group.deliveryFee.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-primary/5 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex justify-between items-center mb-4">
                    <span className="text-lg sm:text-xl font-bold">TOTAL</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary">KSh {groupTotal.toLocaleString()}</span>
                  </div>

                  <Link to="/checkout">
                    <Button className="w-full touch-target hover:shadow-lg transition-shadow" size="lg">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Checkout {isMobile ? '' : group.vendorName}
                    </Button>
                  </Link>
                </Card>

                {/* Separator between vendors */}
                {groupIndex < vendorGroups.length - 1 && <Separator className="my-6 sm:my-8" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Cart;
