import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart,
  Receipt, Printer, Clock, X, CreditCard, Smartphone, Banknote, History
} from 'lucide-react';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  image_url?: string | null;
}

interface POSSale {
  id: string;
  sale_number: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
];

export default function VendorPOS() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [receiptSale, setReceiptSale] = useState<POSSale | null>(null);
  const [recentSales, setRecentSales] = useState<POSSale[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Fetch vendor profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setVendorId(data.id);
    })();
  }, [user]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_available', true)
      .order('name');
    setProducts(data || []);
    setLoading(false);
  }, [vendorId]);

  // Fetch recent sales
  const fetchRecentSales = useCallback(async () => {
    if (!vendorId) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('pos_sales')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('created_at', today)
      .order('created_at', { ascending: false });
    setRecentSales((data as unknown as POSSale[]) || []);
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) {
      fetchProducts();
      fetchRecentSales();
    }
  }, [vendorId, fetchProducts, fetchRecentSales]);

  const filtered = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    ), [products, search]);

  const subtotal = useMemo(() =>
    cart.reduce((s, i) => s + i.total, 0), [cart]);

  const total = useMemo(() =>
    Math.max(subtotal - discount, 0), [subtotal, discount]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
        image_url: product.image_url,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(i => {
        if (i.product_id !== productId) return i;
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty, total: newQty * i.price };
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const completeSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!vendorId) return;
    setCompleting(true);

    try {
      const saleNumber = `POS-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await (supabase as any)
        .from('pos_sales')
        .insert([{
          vendor_id: vendorId,
          sale_number: saleNumber,
          items: cart as unknown as Record<string, unknown>[],
          subtotal,
          discount,
          total,
          payment_method: paymentMethod,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          notes: notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Decrement stock for each item
      for (const item of cart) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      }

      setReceiptSale(data as unknown as POSSale);
      toast.success('Sale completed!');
      fetchProducts();
      fetchRecentSales();
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete sale');
    } finally {
      setCompleting(false);
    }
  };

  const resetSale = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('cash');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setReceiptSale(null);
  };

  const printReceipt = () => window.print();

  if (loading && !products.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const todayTotal = recentSales.reduce((s, sale) => s + Number(sale.total), 0);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/vendor/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Point of Sale</h1>
              <p className="text-xs text-muted-foreground">
                Today: {recentSales.length} sales • KES {todayTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile cart toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden relative gap-1"
              onClick={() => setShowCart(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              {cart.length > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {cart.length}
                </Badge>
              )}
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Sales</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Today's Sales</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>{recentSales.length} sales</span>
                    <span>KES {todayTotal.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <ScrollArea className="h-[calc(100vh-180px)]">
                    <div className="space-y-2 pr-2">
                      {recentSales.map(sale => (
                        <Card key={sale.id} className="p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => setReceiptSale(sale)}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{sale.sale_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(sale.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">KES {Number(sale.total).toLocaleString()}</p>
                              <Badge variant="secondary" className="text-[10px]">{sale.payment_method}</Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                      {recentSales.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No sales today</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Product Grid */}
        <div className="flex-1 p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(product => (
              <Card
                key={product.id}
                className="p-3 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all active:scale-95"
                onClick={() => addToCart(product)}
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-20 object-cover rounded-md mb-2"
                  />
                )}
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-bold text-primary">KES {product.price}</span>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <Badge variant="destructive" className="text-[9px] px-1">Low</Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Stock: {product.stock_quantity}</p>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-12">No products found</p>
            )}
          </div>
        </div>

        {/* Cart Panel - Desktop */}
        <div className="hidden lg:flex w-[380px] border-l bg-card flex-col h-[calc(100vh-57px)] overflow-hidden">
          <CartPanel
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            total={total}
            paymentMethod={paymentMethod}
            customerName={customerName}
            customerPhone={customerPhone}
            notes={notes}
            completing={completing}
            onDiscount={setDiscount}
            onPaymentMethod={setPaymentMethod}
            onCustomerName={setCustomerName}
            onCustomerPhone={setCustomerPhone}
            onNotes={setNotes}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onComplete={completeSale}
            onClear={resetSale}
          />
        </div>
      </div>

      {/* Mobile Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle>Current Sale ({cart.length} items)</SheetTitle>
            </SheetHeader>
            <CartPanel
              cart={cart}
              subtotal={subtotal}
              discount={discount}
              total={total}
              paymentMethod={paymentMethod}
              customerName={customerName}
              customerPhone={customerPhone}
              notes={notes}
              completing={completing}
              onDiscount={setDiscount}
              onPaymentMethod={setPaymentMethod}
              onCustomerName={setCustomerName}
              onCustomerPhone={setCustomerPhone}
              onNotes={setNotes}
              onUpdateQty={updateQty}
              onRemove={removeFromCart}
              onComplete={() => { completeSale(); setShowCart(false); }}
              onClear={() => { resetSale(); setShowCart(false); }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile sticky bottom bar */}
      {cart.length > 0 && (
        <div className="lg:hidden sticky bottom-0 border-t bg-card p-3 flex items-center justify-between"
          onClick={() => setShowCart(true)}>
          <div>
            <p className="text-sm font-medium">{cart.length} item{cart.length > 1 ? 's' : ''}</p>
            <p className="text-lg font-bold text-primary">KES {total.toLocaleString()}</p>
          </div>
          <Button size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" /> View Cart
          </Button>
        </div>
      )}

      {/* Receipt Modal */}
      <Dialog open={!!receiptSale} onOpenChange={() => setReceiptSale(null)}>
        <DialogContent className="max-w-sm print:max-w-full print:shadow-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Sale Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptSale && (
            <div className="space-y-3 text-sm">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-lg">{receiptSale.sale_number}</p>
                <p className="text-muted-foreground">
                  {new Date(receiptSale.created_at).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                {(receiptSale.items as CartItem[]).map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>KES {item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>KES {Number(receiptSale.subtotal).toLocaleString()}</span>
                </div>
                {Number(receiptSale.discount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-KES {Number(receiptSale.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>KES {Number(receiptSale.total).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment</span>
                <Badge variant="secondary">{receiptSale.payment_method}</Badge>
              </div>
              {receiptSale.customer_name && (
                <p className="text-muted-foreground">Customer: {receiptSale.customer_name}</p>
              )}
              <div className="flex gap-2 pt-2 print:hidden">
                <Button variant="outline" className="flex-1 gap-1" onClick={printReceipt}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button className="flex-1" onClick={resetSale}>
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Cart Panel (reused in desktop sidebar & mobile sheet) ─── */

interface CartPanelProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  completing: boolean;
  onDiscount: (v: number) => void;
  onPaymentMethod: (v: string) => void;
  onCustomerName: (v: string) => void;
  onCustomerPhone: (v: string) => void;
  onNotes: (v: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onComplete: () => void;
  onClear: () => void;
}

function CartPanel({
  cart, subtotal, discount, total, paymentMethod,
  customerName, customerPhone, notes, completing,
  onDiscount, onPaymentMethod, onCustomerName, onCustomerPhone, onNotes,
  onUpdateQty, onRemove, onComplete, onClear,
}: CartPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Tap products to add</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">KES {item.price} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => onUpdateQty(item.product_id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => onUpdateQty(item.product_id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-bold w-20 text-right">
                  KES {item.total.toLocaleString()}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => onRemove(item.product_id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {cart.length > 0 && (
        <div className="shrink-0 border-t p-4 space-y-3 bg-card" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Discount (KES)</label>
              <Input
                type="number"
                min={0}
                value={discount || ''}
                onChange={e => onDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment</label>
              <div className="flex gap-1 mt-1">
                {PAYMENT_METHODS.map(pm => (
                  <Button
                    key={pm.id}
                    variant={paymentMethod === pm.id ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 gap-0.5 text-[10px] px-1 h-9"
                    onClick={() => onPaymentMethod(pm.id)}
                  >
                    <pm.icon className="h-3 w-3" />
                    {pm.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Discount</span>
              <span>-KES {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">KES {total.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear} className="gap-1">
              <Trash2 className="h-3 w-3" /> Clear
            </Button>
            <Button
              className="flex-1 gap-1"
              onClick={onComplete}
              disabled={completing}
            >
              {completing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
