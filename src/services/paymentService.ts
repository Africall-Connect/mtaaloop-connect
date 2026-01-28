import { supabase } from "@/lib/supabaseClient";

interface InitiateMpesaPaymentRequest {
  phone: string;
  amount: number;
  orderId: string;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

interface CheckPaymentStatusRequest {
  transactionId: string;
}

interface PaymentStatusResponse {
  status: 'pending' | 'success' | 'failed';
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const DEMO_MODE = import.meta.env.VITE_DEMO_PAYMENT_MODE === 'true';

export const initiateMpesaPayment = async (request: InitiateMpesaPaymentRequest): Promise<PaymentResponse> => {
  // Demo mode for testing without backend
  if (DEMO_MODE) {
    console.log('🔧 Demo Payment Mode - Simulating M-PESA payment:', request);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment
    return {
      success: true,
      message: 'M-PESA STK Push sent successfully (Demo Mode)',
      transactionId: `DEMO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payments/initiate-mpesa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaymentResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error initiating M-PESA payment:', error);
    return {
      success: false,
      message: 'Failed to initiate payment. Please try again.',
    };
  }
};

export async function retryPaystackPayment(orderId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("payments-paystack-init", {
      body: { order_id: orderId },
    });

    if (error) {
      console.error("Retry Paystack error:", error);
      return { success: false, message: "Failed to retry payment." };
    }

    const { authorization_url } = data as { authorization_url: string; reference: string };

    if (!authorization_url) {
      return { success: false, message: "No authorization URL returned from Paystack." };
    }

    window.location.href = authorization_url;
    return { success: true };
  } catch (err) {
    console.error("Retry Paystack error:", err);
    return { success: false, message: "Failed to retry payment." };
  }
}

export const checkPaymentStatus = async (request: CheckPaymentStatusRequest): Promise<PaymentStatusResponse> => {
  // Demo mode for testing without backend
  if (DEMO_MODE) {
    console.log('🔧 Demo Payment Mode - Checking payment status:', request);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful payment after a short delay
    const isDemoTransaction = request.transactionId.startsWith('DEMO-');
    if (isDemoTransaction) {
      return {
        status: 'success',
        message: 'Payment successful (Demo Mode)',
      };
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/payments/status/${request.transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PaymentStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      status: 'failed',
      message: 'Failed to check payment status.',
    };
  }
};
