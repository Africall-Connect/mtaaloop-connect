import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerSnapshot {
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string | null;
  } | null;
  wallet: {
    balance: number;
    last_tx_at: string | null;
  } | null;
  recentOrders: Array<{
    id: string;
    order_number: string | null;
    total_amount: number | null;
    status: string | null;
    created_at: string;
  }>;
  recentTickets: Array<{
    id: string;
    subject: string;
    status: string;
    created_at: string;
  }>;
  recentChats: Array<{
    chat_id: string;
    is_closed: boolean;
    created_at: string;
  }>;
  loading: boolean;
  error?: string;
}

const empty: CustomerSnapshot = {
  profile: null,
  wallet: null,
  recentOrders: [],
  recentTickets: [],
  recentChats: [],
  loading: true,
};

/**
 * Resolve a customer profile from whatever source has data, in this order:
 * 1. customer_profiles table (works for CSR + admin via RLS)
 * 2. app_users view (works for admin; gives email + first/last name)
 * 3. get_user_details_by_id RPC (admin-scoped)
 * 4. Fallback synthesized profile from any orders found
 */
async function resolveProfile(customerId: string): Promise<CustomerSnapshot["profile"]> {
  // 1. customer_profiles
  try {
    const { data } = await (supabase.from("customer_profiles") as any)
      .select("user_id, full_name, phone, created_at")
      .eq("user_id", customerId)
      .maybeSingle();
    if (data) {
      return {
        id: customerId,
        name: data.full_name || null,
        email: null,
        phone: data.phone || null,
        created_at: data.created_at || null,
      };
    }
  } catch { /* fall through */ }

  // 2. app_users view (joined from auth.users)
  try {
    const { data } = await (supabase.from("app_users") as any)
      .select("id, email, first_name, last_name, phone")
      .eq("id", customerId)
      .maybeSingle();
    if (data) {
      return {
        id: data.id,
        name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        email: data.email || null,
        phone: data.phone || null,
        created_at: null,
      };
    }
  } catch { /* fall through */ }

  // 3. RPC
  try {
    const { data } = await (supabase.rpc as any)("get_user_details_by_id", { user_ids: [customerId] });
    const u = (data as any[])?.[0];
    if (u) {
      return {
        id: u.id,
        name: u.raw_user_meta_data?.full_name || u.raw_user_meta_data?.name || null,
        email: u.email || null,
        phone: u.raw_user_meta_data?.phone || null,
        created_at: u.created_at || null,
      };
    }
  } catch { /* fall through */ }

  // 4. Synthesize from any order's full_name (orders table is readable by CSR)
  try {
    const { data } = await supabase
      .from("orders")
      .select("full_name, user_email, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      return {
        id: customerId,
        name: data.full_name || null,
        email: data.user_email || null,
        phone: null,
        created_at: data.created_at || null,
      };
    }
  } catch { /* fall through */ }

  // 5. Last resort — return a placeholder so the UI still renders
  return {
    id: customerId,
    name: null,
    email: null,
    phone: null,
    created_at: null,
  };
}

export function useCustomerSnapshot(customerId: string | null | undefined): CustomerSnapshot {
  const [state, setState] = useState<CustomerSnapshot>(empty);

  useEffect(() => {
    if (!customerId) {
      setState({ ...empty, loading: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    (async () => {
      try {
        const [profile, wallet, walletTx, orders, tickets, chats] = await Promise.all([
          resolveProfile(customerId),
          (supabase.from("customer_wallet") as any).select("balance, updated_at").eq("user_id", customerId).maybeSingle(),
          (supabase.from("customer_wallet_tx") as any).select("created_at").eq("user_id", customerId).order("created_at", { ascending: false }).limit(1),
          supabase.from("orders").select("id, order_number, total_amount, status, created_at").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(5),
          (supabase.from("support_tickets") as any).select("id, subject, status, created_at").eq("customer_id", customerId).order("created_at", { ascending: false }).limit(3),
          (supabase.from("private_chats") as any).select("chat_id, is_closed, created_at").eq("initiator_id", customerId).order("created_at", { ascending: false }).limit(3),
        ]);

        if (cancelled) return;

        const w = wallet?.data as any;
        const lastTx = (walletTx?.data as any[])?.[0];

        setState({
          profile,
          wallet: w ? { balance: Number(w.balance || 0), last_tx_at: lastTx?.created_at || null } : { balance: 0, last_tx_at: null },
          recentOrders: (orders.data as any[]) || [],
          recentTickets: (tickets.data as any[]) || [],
          recentChats: (chats.data as any[]) || [],
          loading: false,
        });
      } catch (e: any) {
        if (cancelled) return;
        // Even on hard failure, at least give back a placeholder profile so the page doesn't crash
        setState({
          ...empty,
          profile: { id: customerId, name: null, email: null, phone: null, created_at: null },
          loading: false,
          error: e?.message || "Failed to load",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return state;
}
