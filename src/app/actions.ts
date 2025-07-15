"use server";

import {
  estimateDeliveryTime,
  type EstimateDeliveryTimeInput,
  type EstimateDeliveryTimeOutput,
} from "@/ai/flows/estimate-delivery-time";
import { z } from "zod";

const EstimateDeliveryTimeInputSchema = z.object({
  cookAvailability: z.string().min(1, "Cook availability is required."),
  preparationTime: z.coerce.number().min(1, "Preparation time must be positive."),
  deliveryDistance: z.coerce.number().min(0.1, "Delivery distance must be positive."),
  currentOrders: z.coerce.number().min(0, "Current orders cannot be negative."),
  timeOfOrder: z.string().min(1, "Time of order is required."),
  cookSpecialties: z.string().min(1, "Cook specialties are required."),
  customerAddress: z.string().min(1, "Customer address is required."),
});

type FormState = {
  message: string;
  data?: EstimateDeliveryTimeOutput;
  errors?: {
    [key in keyof EstimateDeliveryTimeInput]?: string[];
  };
};

export async function getDeliveryTimeEstimate(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = EstimateDeliveryTimeInputSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: "Form validation failed. Please check the fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await estimateDeliveryTime(validatedFields.data);
    return {
      message: "Estimation successful.",
      data: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An unexpected error occurred while communicating with the AI. Please try again later.",
    };
  }
}
