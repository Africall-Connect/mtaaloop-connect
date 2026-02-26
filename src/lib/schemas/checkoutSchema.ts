import { z } from "zod";

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

// Full checkout form schema
export const checkoutFormSchema = z.object({
  deliveryAddress: deliveryAddressSchema,
  instructions: deliveryInstructionsSchema,
  deliveryType: z.enum(["asap", "schedule"]),
  paymentMethod: z.enum(["wallet", "pay_on_delivery"]),
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

// Payment step validation
export const paymentStepSchema = z.discriminatedUnion("paymentMethod", [
  z.object({ paymentMethod: z.literal("wallet") }),
  z.object({ paymentMethod: z.literal("pay_on_delivery") }),
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

export function validatePaymentStep(
  paymentMethod: string
): { success: boolean; errors: Record<string, string> } {
  const result = paymentStepSchema.safeParse({ paymentMethod });

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
}): {
  instructions: string;
  houseNumber: string;
} {
  return {
    instructions: (data.instructions || "")
      .trim()
      .slice(0, 500)
      .replace(/<[^>]*>/g, ""),
    houseNumber: data.houseNumber
      .trim()
      .slice(0, 50)
      .replace(/[^a-zA-Z0-9\s\-\/]/g, ""),
  };
}
