import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RawProduct {
  product_id?: string;
  id?: string;
  name: string;
  total_quantity: number;
  total_revenue: number;
  stock_quantity?: number;
}

interface ProductStats {
  product_id: string;
  product_name: string;
  orders: number;
  stock_quantity: number;
  rating: number;
  reviews: number;
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
      const { data, error } = await supabase.rpc(
        rpcName,
        {
          vendor_uuid: vendorId,
          time_range: 'week',
        }
      );

      if (error) {
        console.error('Error fetching top products:', error);
        return;
      }

      const formattedProducts = data.map((product: RawProduct) => ({
        product_id: product.product_id || product.id,
        product_name: product.name,
        orders: product.total_quantity,
        stock_quantity: product.stock_quantity,
        rating: 4.5 + Math.random() * 0.5, // Placeholder
        reviews: Math.floor(Math.random() * 50) + 10, // Placeholder
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)], // Placeholder
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
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    const changes: Record<string, string> = {
      up: '↑ 20% from last week',
      down: '↓ 5% from last week',
      stable: '→ Stable'
    };
    return changes[trend] || '→ Stable';
  };

  const productEmojis = ['🍔', '🍕', '🍟', '🥤', '🍗'];

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">Loading products...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🏆 TOP PERFORMING PRODUCTS
          </CardTitle>
          <Button variant="link" size="sm">
            View All →
          </Button>
        </div>
        <div className="text-sm text-gray-600">This Week</div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No product data available yet
          </div>
        ) : (
          products.map((product, index) => (
            <div key={product.product_id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                {/*<div className="text-2xl">{productEmojis[index] || '📦'}</div>*/}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">#{index + 1}</span>
                        <h4 className="font-semibold text-gray-900">{product.product_name}</h4>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-amber-100 text-amber-800">
                        🔥 HOT ITEM
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">
                      {product.orders} orders | {product.stock_quantity} in stock
                    </div>
                    {/*<div className="text-gray-600">
                      Rating: {product.rating.toFixed(1)} ⭐ ({product.reviews} reviews)
                    </div>*/}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(product.trend)}
                    <span className={
                      product.trend === 'up' ? 'text-green-600' :
                      product.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }>
                      Trending: {getTrendText(product.trend)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {products.length > 0 && products[0].trend === 'up' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="font-medium text-blue-900 mb-1">💡 RECOMMENDATION:</div>
            <div className="text-blue-800">
              {products[0].product_name} showing strong growth. Consider creating a combo deal to boost sales further.
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline">Create Promotion</Button>
              <Button size="sm" variant="outline">View Product Details</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
