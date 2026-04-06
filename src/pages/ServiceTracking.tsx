import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, MessageSquare, User, Phone, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { SERVICE_TYPE_META, ServiceType } from "@/types/subscription";

// Resolve display metadata from canonical service_type (with fallback to service_name)
const DEFAULT_SERVICE_MSG = {
  displayName: "Quick Service",
  emoji: "⚡",
  agentLabel: "Service Agent",
  waitingHeadline: "Your request is being processed...",
  waitingSubtext: "An agent will be assigned to you shortly",
  waitingTip: "💡 You'll be notified when your agent is on the way!",
};

const getServiceMessaging = (serviceType: string | null, serviceName: string | null) => {
  if (serviceType && SERVICE_TYPE_META[serviceType as ServiceType]) {
    return SERVICE_TYPE_META[serviceType as ServiceType];
  }
  // Backwards compatibility: legacy rows that only have service_name
  if (serviceName) {
    const match = Object.values(SERVICE_TYPE_META).find(m => m.displayName === serviceName);
    if (match) return match;
  }
  return DEFAULT_SERVICE_MSG;
};

// Status steps
const STATUS_STEPS = [
  { key: "pending", label: "Requested", icon: Circle },
  { key: "assigned", label: "Agent Assigned", icon: User },
  { key: "in_progress", label: "In Progress", icon: Loader2 },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

const getStepIndex = (status: string) => {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

const getProgressValue = (status: string) => {
  const map: Record<string, number> = {
    pending: 15,
    assigned: 45,
    in_progress: 70,
    completed: 100,
  };
  return map[status] || 10;
};

// Mock data fallback when DB table doesn't exist
interface ServiceRequest {
  id: string;
  service_name: string;
  service_type?: string | null;
  status: string;
  house_number: string;
  customer_notes: string | null;
  scheduled_for: string | null;
  amount: number;
  is_subscription_usage: boolean;
  created_at: string;
  agent_name?: string | null;
  agent_phone?: string | null;
}

const ServiceTracking = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId || !user) return;

    const fetchRequest = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from("service_requests")
          .select("*")
          .eq("id", requestId)
          .single();

        if (fetchErr) throw fetchErr;
        setRequest(data as ServiceRequest);
      } catch (err: any) {
        console.warn("service_requests fetch failed, using mock:", err.message);
        // Fallback mock so the page still renders
        setRequest({
          id: requestId!,
          service_name: "Quick Service",
          status: "pending",
          house_number: "—",
          customer_notes: null,
          scheduled_for: null,
          amount: 0,
          is_subscription_usage: false,
          created_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, user]);

  // Realtime subscription
  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`service-req-${requestId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_requests", filter: `id=eq.${requestId}` },
        (payload) => {
          setRequest((prev) => (prev ? { ...prev, ...payload.new } : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <p className="text-destructive font-medium">{error || "Request not found"}</p>
        <Button variant="outline" onClick={() => navigate("/home")}>Go Home</Button>
      </div>
    );
  }

  const messaging = getServiceMessaging(request.service_type ?? null, request.service_name);
  const currentStep = getStepIndex(request.status);
  const progressVal = getProgressValue(request.status);
  const isCompleted = request.status === "completed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">Service Tracking</h1>
            <p className="text-xs text-muted-foreground font-mono truncate">#{request.id.slice(0, 8)}</p>
          </div>
          <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-emerald-600" : ""}>
            {request.status.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
          </Badge>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-5 max-w-lg mx-auto">
        {/* Waiting Bay Hero */}
        <AnimatePresence mode="wait">
          {!isCompleted && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                <CardContent className="py-6 text-center space-y-3">
                  <motion.span
                    className="text-5xl block"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  >
                    {messaging.emoji}
                  </motion.span>
                  <h2 className="text-lg font-bold">{messaging.waitingHeadline}</h2>
                  <p className="text-sm text-muted-foreground">{messaging.waitingSubtext}</p>
                  <p className="text-xs text-muted-foreground/80 italic">{messaging.waitingTip}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                <CardContent className="py-6 text-center space-y-2">
                  <span className="text-5xl block">✅</span>
                  <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Service Complete!</h2>
                  <p className="text-sm text-muted-foreground">Thank you for using Mtaaloop services.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressVal} className="h-2" />
          <p className="text-xs text-right text-muted-foreground">{progressVal}%</p>
        </div>

        {/* Status Stepper */}
        <Card>
          <CardContent className="py-5">
            <div className="space-y-4">
              {STATUS_STEPS.map((step, i) => {
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <StepIcon className={`h-4 w-4 ${isActive && step.key === "in_progress" ? "animate-spin" : ""}`} />
                    </div>
                    <span className={`text-sm font-medium ${isDone ? "text-emerald-700 dark:text-emerald-400" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{messaging.emoji}</span>
              <span className="font-medium">{request.service_name}</span>
            </div>

            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{request.house_number}</span>
            </div>

            {request.scheduled_for && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Scheduled: {new Date(request.scheduled_for).toLocaleString()}</span>
              </div>
            )}

            {request.customer_notes && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{request.customer_notes}</span>
              </div>
            )}

            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold">
                {request.is_subscription_usage ? (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">Free (Subscription)</Badge>
                ) : (
                  `KSh ${request.amount}`
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Requested</span>
              <span>{new Date(request.created_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Agent Info (when assigned) */}
        {request.agent_name && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{messaging.agentLabel}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{request.agent_name}</p>
                {request.agent_phone && (
                  <p className="text-xs text-muted-foreground">{request.agent_phone}</p>
                )}
              </div>
              {request.agent_phone && (
                <Button variant="outline" size="icon" asChild>
                  <a href={`tel:${request.agent_phone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/home")}>
            Back to Home
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/quick-services")}>
            More Services
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceTracking;
