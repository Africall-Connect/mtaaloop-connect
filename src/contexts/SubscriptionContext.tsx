import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  SubscriptionPlan,
  SubscriptionFeatures,
  UserSubscription,
  SubscriptionUsage,
  UsageType,
  UsageStatus,
  SubscriptionBenefits,
  SubscriptionState,
  SUBSCRIPTION_PLANS,
} from '@/types/subscription';

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  checkCanUseService: (serviceType: UsageType) => boolean;
  consumeServiceUsage: (serviceType: UsageType) => Promise<boolean>;
  getRemainingUsage: (serviceType: UsageType) => number | 'unlimited';
  getEffectivePrice: (basePrice: number, serviceType?: UsageType) => number;
  calculateCashback: (amount: number) => number;
}

const defaultUsageStatus: UsageStatus = {
  used: 0,
  limit: null,
  remaining: 0,
  percentUsed: 0,
};

const defaultBenefits: SubscriptionBenefits = {
  cashbackPercent: 0,
  freeDelivery: false,
  prioritySupport: false,
  agentScheduling: false,
};

const defaultState: SubscriptionState = {
  isSubscribed: false,
  plan: null,
  subscription: null,
  usage: {
    delivery: defaultUsageStatus,
    trash: defaultUsageStatus,
    osha_viombo: defaultUsageStatus,
    cleaning: defaultUsageStatus,
    laundry: defaultUsageStatus,
    meal_prep: defaultUsageStatus,
    errand: defaultUsageStatus,
    package_collection: defaultUsageStatus,
  },
  benefits: defaultBenefits,
  expiresAt: null,
  loading: true,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);

  // Get current month in '2026-01' format
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Fetch subscription data from DB or use mock data for development
  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, loading: false });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      // Try to fetch from database
      const { data: subscriptionData, error: subError } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('current_period_end', new Date().toISOString())
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.log('Using mock subscription data (tables not yet created)');
        setState({ ...defaultState, loading: false });
        return;
      }

      if (!subscriptionData) {
        setState({ ...defaultState, loading: false });
        return;
      }

      const plan = subscriptionData.plan as unknown as SubscriptionPlan;
      const features = plan?.features as SubscriptionFeatures | undefined;

      // Fetch usage for current period
      const currentPeriod = getCurrentPeriod();
      const { data: usageData } = await (supabase as any)
        .from('subscription_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_month', currentPeriod);

      const usageArr = (usageData || []) as SubscriptionUsage[];

      // Build usage status for each service type
      const usageMap: Record<UsageType, UsageStatus> = {
        delivery: buildUsageStatus(usageArr, 'delivery', features?.deliveries),
        trash: buildUsageStatus(usageArr, 'trash', features?.trash),
        osha_viombo: buildUsageStatus(usageArr, 'osha_viombo', features?.osha_viombo),
        cleaning: buildUsageStatus(usageArr, 'cleaning', features?.cleaning),
        laundry: buildUsageStatus(usageArr, 'laundry', features?.laundry),
        meal_prep: buildUsageStatus(usageArr, 'meal_prep', features?.meal_prep),
        errand: buildUsageStatus(usageArr, 'errand', features?.errands),
        package_collection: buildUsageStatus(usageArr, 'package_collection', null),
      };

      const benefits: SubscriptionBenefits = {
        cashbackPercent: features?.cashback_percent || 0,
        freeDelivery: (features?.deliveries ?? 0) > 0,
        prioritySupport: features?.priority_support || false,
        agentScheduling: features?.agent_scheduling || false,
      };

      setState({
        isSubscribed: true,
        plan,
        subscription: subscriptionData as unknown as UserSubscription,
        usage: usageMap,
        benefits,
        expiresAt: new Date(subscriptionData.current_period_end),
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setState({ ...defaultState, loading: false });
    }
  }, [user]);

  const buildUsageStatus = (
    usageData: SubscriptionUsage[] | null,
    type: UsageType,
    limit: number | null | undefined
  ): UsageStatus => {
    const usage = usageData?.find(u => u.usage_type === type);
    const used = usage?.used_amount || 0;
    const actualLimit = limit === undefined ? null : limit;

    return {
      used,
      limit: actualLimit,
      remaining: actualLimit === null ? 'unlimited' : Math.max(0, actualLimit - used),
      percentUsed: actualLimit === null ? 0 : actualLimit > 0 ? Math.round((used / actualLimit) * 100) : 0,
    };
  };

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const checkCanUseService = (serviceType: UsageType): boolean => {
    if (!state.isSubscribed) return false;
    
    const usage = state.usage[serviceType];
    if (!usage) return false;
    
    // If limit is null, it's unlimited
    if (usage.limit === null) return true;
    
    // Check if service is included in plan (limit > 0 or null)
    if (usage.limit === 0) return false;
    
    return usage.remaining === 'unlimited' || usage.remaining > 0;
  };

  const consumeServiceUsage = async (serviceType: UsageType): Promise<boolean> => {
    if (!user || !state.isSubscribed) return false;
    if (!checkCanUseService(serviceType)) return false;

    const currentPeriod = getCurrentPeriod();

    try {
      // Upsert usage record
      const { error } = await (supabase as any).rpc('increment_subscription_usage', {
        p_user_id: user.id,
        p_usage_type: serviceType,
        p_period_month: currentPeriod,
      });

      if (error) {
        // RPC might not exist, try direct update
        const { data: existing } = await (supabase as any)
          .from('subscription_usage')
          .select('id, used_amount')
          .eq('user_id', user.id)
          .eq('usage_type', serviceType)
          .eq('period_month', currentPeriod)
          .maybeSingle();

        if (existing) {
          await (supabase as any)
            .from('subscription_usage')
            .update({ used_amount: (existing as any).used_amount + 1 })
            .eq('id', (existing as any).id);
        } else {
          await (supabase as any).from('subscription_usage').insert({
            user_id: user.id,
            usage_type: serviceType,
            period_month: currentPeriod,
            used_amount: 1,
            limit_amount: state.usage[serviceType]?.limit,
          });
        }
      }

      // Refresh state
      await refreshSubscription();
      return true;
    } catch (error) {
      console.error('Error consuming service usage:', error);
      return false;
    }
  };

  const getRemainingUsage = (serviceType: UsageType): number | 'unlimited' => {
    const usage = state.usage[serviceType];
    if (!usage) return 0;
    return usage.remaining;
  };

  const getEffectivePrice = (basePrice: number, serviceType?: UsageType): number => {
    // If service is covered by subscription, return 0
    if (serviceType && checkCanUseService(serviceType)) {
      return 0;
    }
    return basePrice;
  };

  const calculateCashback = (amount: number): number => {
    if (!state.isSubscribed || !state.benefits.cashbackPercent) return 0;
    return Math.floor(amount * (state.benefits.cashbackPercent / 100));
  };

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refreshSubscription,
        checkCanUseService,
        consumeServiceUsage,
        getRemainingUsage,
        getEffectivePrice,
        calculateCashback,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
