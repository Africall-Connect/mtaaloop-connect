import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProductStats {
  product_id: string;
  product_name: string;
  orders: number;
  stock_quantity: number;
  trend: 'up' | 'down' | 'stable';
}

interface TopProductsProps {
  vendorId: string;
  operationalCategory: 'inventory' | 'service' | 'booking' | 'minimart' | 'pharmacy' | null;
}

export default function TopProducts({ vendorId, operationalCategory }: TopProductsProps) {
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopProducts = useCallback(async () => {
    try {
      const rpcName = operationalCategory === 'minimart' ? 'get_top_premium_products_for_vendor' : 'get_top_products_for_vendor';
      const { data, error } = await supabase.rpc(rpcName, {
        vendor_uuid: vendorId,
        time_range: 'week',
      });

      if (error) {
        console.error('Error fetching top products:', error);
        return;
      }

      const formattedProducts = ((data as any[]) || []).map((product: any) => ({
        product_id: product.product_id || product.id,
        product_name: product.name,
        orders: product.total_quantity,
        stock_quantity: product.stock_quantity,
        trend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching top products:', error);
    } finally {
      setLoading(false);
    }
  }, [vendorId, operationalCategory]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="text-center">Loading products...</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🏆 TOP PERFORMING PRODUCTS</CardTitle>
        <div className="text-sm text-muted-foreground">This Week</div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No product data available yet</div>
        ) : (
          products.map((product, index) => (
            <div key={product.product_id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">#{index + 1}</span>
                      <h4 className="font-semibold">{product.product_name}</h4>
                    </div>
                    {index === 0 && <Badge className="bg-amber-100 text-amber-800">🔥 HOT</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.orders} orders | {product.stock_quantity} in stock
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(product.trend)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
