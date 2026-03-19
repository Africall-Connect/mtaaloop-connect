import { useEffect, useState, useCallback } from "react";
import {
  getActiveDelivery,
  updateDeliveryStatus,
  type DeliveryStatus,
} from "../lib/deliveries";

interface Delivery {
  id: string;
  status: DeliveryStatus;
  vendor_name?: string;
  pickup_address?: string;
  delivery_address?: string;
}

export function useActiveDelivery() {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveDelivery();
      setDelivery(data as any);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load delivery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const advance = useCallback(
    async (nextStatus: DeliveryStatus, extra?: Record<string, unknown>) => {
      if (!delivery) return;
      if (updating) return;
      setUpdating(true);
      setError(null);
      try {
        await updateDeliveryStatus(delivery.id, delivery.status, nextStatus, extra);
        await load();
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to update delivery status");
      } finally {
        setUpdating(false);
      }
    },
    [delivery, load, updating]
  );

  return {
    delivery,
    loading,
    updating,
    error,
    refresh: load,
    advance,
  };
}
