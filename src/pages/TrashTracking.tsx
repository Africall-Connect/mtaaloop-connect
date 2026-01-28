import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageCircle, CheckCircle, Clock, Trash2, MapPin, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface TrashCollectionData {
  id: string;
  customer_id: string;
  estate_id: string;
  amount: number;
  status: string;
  house: string;
  full_name: string;
  customer_notes: string | null;
  created_at: string;
  payment_status: string;
}

interface TrashDeliveryData {
  id: string;
  trash_collection_id: string;
  rider_id: string | null;
  status: string;
  created_at: string;
  pickup_time: string | null;
  completion_time: string | null;
}

const TrashTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState("pending");
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [collectionData, setCollectionData] = useState<TrashCollectionData | null>(null);
  const [deliveryData, setDeliveryData] = useState<TrashDeliveryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  // Initial load
  useEffect(() => {
    if (orderId && user) {
      loadTrashCollection();
    }
  }, [orderId, user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!orderId) return;

    console.log("[TrashTracking] subscribing to realtime for trash collection", orderId);

    const collectionChannel = supabase
      .channel(`trash-collection-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trash_collection",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[Realtime] trash collection update:", payload);
          const newStatus = payload.new.status as string;
          setCollectionStatus(newStatus);
          setLastUpdateTime(new Date().toLocaleTimeString());
          updateProgressFromStatus(newStatus);

          if (newStatus === "completed") {
            setIsCompleted(true);
            toast.success("🎉 Trash Collection Complete!", {
              description: "Your trash has been picked up and disposed properly.",
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    const deliveryChannel = supabase
      .channel(`trash-delivery-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trash_deliveries",
          filter: `trash_collection_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[Realtime] trash delivery update:", payload);
          const newStatus = payload.new.status as string;
          setDeliveryStatus(newStatus);
          setLastUpdateTime(new Date().toLocaleTimeString());

          if (newStatus === "completed") {
            setIsCompleted(true);
            setProgress(100);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[TrashTracking] unsubscribing realtime");
      supabase.removeChannel(collectionChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [orderId]);

  const loadTrashCollection = async () => {
    try {
      const { data: collection, error: collectionError } = await supabase
        .from('trash_collection')
        .select('*')
        .eq('id', orderId)
        .single();

      if (collectionError) throw collectionError;

      setCollectionData(collection);
      setCollectionStatus(collection.status);
      updateProgressFromStatus(collection.status);

      // Load delivery data
      const { data: delivery, error: deliveryError } = await supabase
        .from('trash_deliveries')
        .select('*')
        .eq('trash_collection_id', orderId)
        .single();

      if (deliveryError && deliveryError.code !== 'PGRST116') {
        console.error("Error loading delivery:", deliveryError);
      }

      if (delivery) {
        setDeliveryData(delivery);
        setDeliveryStatus(delivery.status);
      }
    } catch (err: unknown) {
      console.error("Error loading trash collection:", err);
      setError(`Failed to load trash collection: ${(err as Error).message}`);
    }
  };

  const updateProgressFromStatus = (status: string) => {
    switch (status) {
      case "pending":
        setProgress(20);
        break;
      case "assigned":
        setProgress(40);
        break;
      case "picked_up":
        setProgress(70);
        break;
      case "completed":
        setProgress(100);
        setIsCompleted(true);
        break;
      default:
        setProgress(0);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Finding nearest agent";
      case "assigned":
        return "Agent assigned - on the way";
      case "picked_up":
        return "Trash picked up - disposing";
      case "completed":
        return "Collection complete";
      case "cancelled":
        return "Collection cancelled";
      default:
        return "Processing";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-6 max-w-3xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-destructive">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link to="/home">Go to Home</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-4 animate-pulse">
            <Trash2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-50/30 to-background">
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trash Collection</h1>
              <p className="text-sm text-muted-foreground">Track your pickup in real-time</p>
            </div>
          </div>
        </div>

        {isCompleted ? (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-6">
                <CheckCircle className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2">✅ Collection Complete!</h2>
              <p className="text-muted-foreground">
                Completed at {deliveryData?.completion_time ? new Date(deliveryData.completion_time).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your trash has been properly disposed
              </p>
            </div>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Collection Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup Location</span>
                  <span className="font-medium">House {collectionData.house}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-medium">KSh {collectionData.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant="default" className="bg-green-600">Paid</Badge>
                </div>
                {collectionData.customer_notes && (
                  <div className="pt-3 border-t">
                    <span className="text-muted-foreground text-sm">Your Notes:</span>
                    <p className="text-sm mt-1">{collectionData.customer_notes}</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/trash-collection")}>
                Request Again
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/home")}>
                Back to Home
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 animate-pulse"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-4 animate-bounce">
                  <span className="text-4xl">
                    {collectionStatus === "pending" ? "🔍" : collectionStatus === "assigned" ? "🚛" : "🗑️"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">{getStatusLabel(collectionStatus)}</h2>
                <p className="text-muted-foreground mb-2">
                  {collectionStatus === "pending" && "We're finding the nearest available agent"}
                  {collectionStatus === "assigned" && "Agent is on the way to your location"}
                  {collectionStatus === "picked_up" && "Agent is transporting trash to disposal site"}
                </p>
                {lastUpdateTime && (
                  <Badge variant="secondary" className="mb-4">
                    Last updated: {lastUpdateTime}
                  </Badge>
                )}
                <Progress value={progress} className="h-2 mb-4" />
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Collection Timeline</h3>
                <Badge variant="outline">Live Updates</Badge>
              </div>
              <div className="space-y-6 relative">
                {[
                  { label: "Request Placed", status: "pending", done: true, icon: "📝", description: "Your request has been received" },
                  { label: "Agent Assigned", status: "assigned", done: ["assigned", "picked_up", "completed"].includes(collectionStatus), icon: "🚛", description: "Agent is on the way" },
                  { label: "Trash Picked Up", status: "picked_up", done: ["picked_up", "completed"].includes(collectionStatus), icon: "🗑️", description: "Agent collected your trash" },
                  { label: "Disposed", status: "completed", done: collectionStatus === "completed", icon: "✅", description: "Properly disposed at garbage base" },
                ].map((step, index, arr) => (
                  <div key={index} className="flex items-start gap-4 relative">
                    {index < arr.length - 1 && (
                      <div className={`absolute left-6 top-12 w-0.5 h-full transition-all duration-500 ${step.done ? "bg-emerald-500" : "bg-gray-200"}`} />
                    )}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500 ${step.done ? "bg-emerald-500 text-white ring-4 ring-emerald-100 shadow-lg scale-110" : "bg-gray-100 text-gray-400"} ${collectionStatus === step.status && !step.done ? "animate-pulse ring-4 ring-emerald-300" : ""}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold transition-colors ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {collectionStatus === step.status && !step.done && (
                          <Badge className="animate-pulse bg-emerald-600">In Progress</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {step.description}
                      </p>
                      {step.done && collectionData?.created_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(collectionData.created_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {deliveryData?.rider_id && (
              <Card className="p-6">
                <h3 className="font-bold mb-4">Your Agent</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <div className="font-semibold">Agent Assigned</div>
                    <div className="text-sm text-muted-foreground">⭐ On the way</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Agent
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-bold mb-4">Pickup Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-sm text-muted-foreground">House {collectionData.house}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HomeIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">{collectionData.full_name}</p>
                  </div>
                </div>
                {collectionData.customer_notes && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">📝</span>
                    <div>
                      <p className="font-medium">Special Instructions</p>
                      <p className="text-sm text-muted-foreground">{collectionData.customer_notes}</p>
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Service Fee</span>
                    <span className="text-emerald-600">KSh {collectionData.amount}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Payment: M-PESA (Paid)</div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Need help?</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={() => navigate("/support-live-chat")}>
                  Chat with Support
                </Button>
                <Button variant="outline" size="sm">
                  Call Support
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashTracking;
