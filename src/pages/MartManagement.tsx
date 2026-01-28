import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Truck,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  MapPin,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  useBusinessType,
  useProductCategories,
  useProductsServices,
  useCreateProductService,
  getBusinessTypeDisplayName,
  getBusinessTypeDescription
} from "@/hooks/useManagementData";

const MartManagement = () => {
  // Get business type from URL or default to 'mart'
  const businessTypeName = 'mart'; // This could come from URL params in a real app

  // Database hooks
  const { data: businessType, isLoading: businessTypeLoading } = useBusinessType(businessTypeName);
  const { data: categories = [], isLoading: categoriesLoading } = useProductCategories(businessType?.id);
  const { data: products = [], isLoading: productsLoading } = useProductsServices(businessType?.id);
  const createProductMutation = useCreateProductService();

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    unit: "",
    categoryId: ""
  });

  // Mock data for orders and financials (these would come from separate tables)
  const mockOrders = [
    {
      id: "ORD-001",
      customer: "John Doe",
      service: "Groceries Bundle",
      quantity: 15,
      amount: 2250,
      status: "processing",
      pickupTime: "2025-01-15 10:00",
      deliveryTime: "2025-01-15 16:00",
      address: "River Road, Nairobi"
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      service: "Household Essentials",
      quantity: 8,
      amount: 2800,
      status: "ready",
      pickupTime: "2025-01-14 14:00",
      deliveryTime: "2025-01-15 10:00",
      address: "Westlands, Nairobi"
    },
    {
      id: "ORD-003",
      customer: "Mike Johnson",
      service: "Fresh Produce",
      quantity: 10,
      amount: 1500,
      status: "delivered",
      pickupTime: "2025-01-13 09:00",
      deliveryTime: "2025-01-13 15:00",
      address: "Karen, Nairobi"
    }
  ];

  const mockFinancials = {
    todayRevenue: 8500,
    weekRevenue: 52000,
    monthRevenue: 210000,
    pendingPayments: 4200,
    expenses: 85000,
    profit: 125000
  };

  const [orders] = useState(mockOrders);
  const [financials] = useState(mockFinancials);

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !newService.categoryId || !businessType) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        business_type_id: businessType.id,
        category_id: newService.categoryId,
        name: newService.name,
        description: newService.description || "",
        item_type: "product",
        base_price: parseFloat(newService.price),
        unit: newService.unit || "unit",
        stock_quantity: null, // For products, you might want to add stock management
        track_inventory: true,
        requires_booking: false, // Products don't require booking
        images: [],
        is_active: true,
        is_featured: false,
        availability_status: "available"
      });

      setNewService({ name: "", description: "", price: "", unit: "", categoryId: "" });
      setIsAddServiceOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Loading state
  if (businessTypeLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading business data...</p>
        </div>
      </div>
    );
  }

  if (!businessType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Business type not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-yellow-500";
      case "ready": return "bg-blue-500";
      case "delivered": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing": return <Clock className="w-4 h-4" />;
      case "ready": return <CheckCircle className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/home">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">MtaaLoop Mart</h1>
                <p className="text-green-100">Your neighborhood grocery store</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">KSh {financials.todayRevenue.toLocaleString()}</div>
                <div className="text-sm text-green-100">Today's Revenue</div>
              </div>
              <Button className="bg-white text-green-600 hover:bg-green-50">
                <Phone className="w-4 h-4 mr-2" />
                Call Support
              </Button>
            </div>
          </div>
        </header>

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Catalog</h2>
              <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        placeholder="e.g., Fresh Milk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newService.description}
                        onChange={(e) => setNewService({...newService, description: e.target.value})}
                        placeholder="Describe the product"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (KSh)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService({...newService, price: e.target.value})}
                          placeholder="150"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Select value={newService.unit} onValueChange={(value) => setNewService({...newService, unit: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="per kg/unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per kg">per kg</SelectItem>
                            <SelectItem value="per unit">per unit</SelectItem>
                            <SelectItem value="per pack">per pack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newService.categoryId} onValueChange={(value) => setNewService({...newService, categoryId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddService} className="w-full">
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading products...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-semibold">KSh {product.base_price}</span>
                          <span className="text-sm text-muted-foreground">{product.unit}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{product.total_orders}</div>
                            <div className="text-muted-foreground">Orders</div>
                          </div>
                          <div>
                            <div className="font-medium">KSh {product.total_revenue.toLocaleString()}</div>
                            <div className="text-muted-foreground">Revenue</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Stats
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No products found. Add your first product to get started!
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">Order Management</h2>
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                          <Badge variant="outline" className="capitalize">
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </Badge>
                        </div>
                        <div className="font-bold text-lg">KSh {order.amount}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Items</div>
                        <div className="text-muted-foreground">{order.service}</div>
                      </div>
                      <div>
                        <div className="font-medium">Quantity</div>
                        <div className="text-muted-foreground">{order.quantity} items</div>
                      </div>
                      <div>
                        <div className="font-medium">Order Time</div>
                        <div className="text-muted-foreground">{order.pickupTime}</div>
                      </div>
                      <div>
                        <div className="font-medium">Delivery</div>
                        <div className="text-muted-foreground">{order.deliveryTime}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {order.address}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6">
            <h2 className="text-2xl font-bold">Delivery Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Active Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">18</div>
                  <p className="text-sm text-muted-foreground">Orders in transit</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Available Riders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">12</div>
                  <p className="text-sm text-muted-foreground">Ready for pickup</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Avg. Delivery Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">35min</div>
                  <p className="text-sm text-muted-foreground">Door to door</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <h2 className="text-2xl font-bold">Financial Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">KSh {financials.todayRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+15% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">KSh {financials.weekRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+10% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">KSh {financials.monthRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+18% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">KSh {financials.profit.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">After expenses</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MartManagement;
