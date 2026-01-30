import { z } from "zod";

// Kenyan phone number regex: 07XXXXXXXX, +254XXXXXXXXX, or 254XXXXXXXXX
const kenyaPhoneRegex = /^(\+?254|0)[17]\d{8}$/;

export const deliveryAddressSchema = z.object({
  estate_name: z
    .string()
    .trim()
    .min(1, "Estate name is required")
    .max(100, "Estate name must be less than 100 characters"),
  house_number: z
    .string()
    .trim()
    .min(1, "House/Apartment number is required")
    .max(50, "House number must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-\/]+$/, "House number contains invalid characters"),
});

export const deliveryInstructionsSchema = z
  .string()
  .trim()
  .max(500, "Instructions must be less than 500 characters")
  .optional();

export const mpesaPhoneSchema = z
  .string()
  .trim()
  .regex(kenyaPhoneRegex, "Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)");

export const paybillSchema = z.object({
  paybillNumber: z
    .string()
    .trim()
    .regex(/^\d{5,7}$/, "Paybill number must be 5-7 digits"),
  accountNumber: z
    .string()
    .trim()
    .min(1, "Account number is required")
    .max(20, "Account number must be less than 20 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Account number can only contain letters and numbers"),
});

export const tillNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{5,7}$/, "Till number must be 5-7 digits");

// Full checkout form schema
export const checkoutFormSchema = z.object({
  deliveryAddress: deliveryAddressSchema,
  instructions: deliveryInstructionsSchema,
  deliveryType: z.enum(["asap", "schedule"]),
  paymentMethod: z.enum(["mpesa", "wallet", "mpesa_buygoods", "mpesa_paybill", "split", "paystack"]),
  mpesaPhone: mpesaPhoneSchema.optional(),
  paybillNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  tillNumber: z.string().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to Terms & Conditions" }),
  }),
});

// Delivery step validation
export const deliveryStepSchema = z.object({
  deliveryAddress: deliveryAddressSchema,
  instructions: deliveryInstructionsSchema,
  deliveryType: z.enum(["asap", "schedule"]),
});

// Payment step validation (conditional based on payment method)
export const paymentStepSchema = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.literal("mpesa"),
    mpesaPhone: mpesaPhoneSchema,
  }),
  z.object({
    paymentMethod: z.literal("mpesa_buygoods"),
    tillNumber: tillNumberSchema,
  }),
  z.object({
    paymentMethod: z.literal("mpesa_paybill"),
    paybillNumber: z.string().regex(/^\d{5,7}$/, "Paybill number must be 5-7 digits"),
    accountNumber: z.string().min(1, "Account number is required").max(20),
  }),
  z.object({
    paymentMethod: z.literal("wallet"),
  }),
  z.object({
    paymentMethod: z.literal("split"),
  }),
  z.object({
    paymentMethod: z.literal("paystack"),
  }),
]);

// Types inferred from schemas
export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>;
export type DeliveryStepData = z.infer<typeof deliveryStepSchema>;
export type PaymentStepData = z.infer<typeof paymentStepSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// Validation helper functions
export function validateDeliveryStep(data: {
  estate_name: string;
  house_number: string;
  instructions: string;
  deliveryType: string;
}): { success: boolean; errors: Record<string, string> } {
  const result = deliveryStepSchema.safeParse({
    deliveryAddress: {
      estate_name: data.estate_name,
      house_number: data.house_number,
    },
    instructions: data.instructions,
    deliveryType: data.deliveryType,
  });

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}

export function validateMpesaPhone(phone: string): { valid: boolean; error?: string } {
  const result = mpesaPhoneSchema.safeParse(phone);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.errors[0]?.message };
}

export function validatePaymentStep(
  paymentMethod: string,
  data: {
    mpesaPhone?: string;
    tillNumber?: string;
    paybillNumber?: string;
    accountNumber?: string;
  }
): { success: boolean; errors: Record<string, string> } {
  let schema;
  let validationData: Record<string, unknown> = { paymentMethod };

  switch (paymentMethod) {
    case "mpesa":
      validationData.mpesaPhone = data.mpesaPhone || "";
      break;
    case "mpesa_buygoods":
      validationData.tillNumber = data.tillNumber || "";
      break;
    case "mpesa_paybill":
      validationData.paybillNumber = data.paybillNumber || "";
      validationData.accountNumber = data.accountNumber || "";
      break;
    default:
      // wallet, split, paystack don't need extra validation
      break;
  }

  const result = paymentStepSchema.safeParse(validationData);

  if (result.success) {
    return { success: true, errors: {} };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}

// Sanitize user input before sending to API
export function sanitizeCheckoutData(data: {
  instructions?: string;
  houseNumber: string;
  phone?: string;
}): {
  instructions: string;
  houseNumber: string;
  phone: string;
} {
  return {
    instructions: (data.instructions || "")
      .trim()
      .slice(0, 500)
      .replace(/<[^>]*>/g, ""), // Strip any HTML tags
    houseNumber: data.houseNumber
      .trim()
      .slice(0, 50)
      .replace(/[^a-zA-Z0-9\s\-\/]/g, ""), // Only allow safe characters
    phone: (data.phone || "")
      .trim()
      .replace(/[^\d+]/g, ""), // Only digits and +
  };
}
