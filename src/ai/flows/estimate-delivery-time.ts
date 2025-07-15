'use server';

/**
 * @fileOverview A delivery time estimation AI agent.
 *
 * - estimateDeliveryTime - A function that estimates the delivery time for an order.
 * - EstimateDeliveryTimeInput - The input type for the estimateDeliveryTime function.
 * - EstimateDeliveryTimeOutput - The return type for the estimateDeliveryTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateDeliveryTimeInputSchema = z.object({
  cookAvailability: z
    .string()
    .describe('The cook’s availability, including days and times.'),
  preparationTime: z.number().describe('The preparation time for the dish in minutes.'),
  deliveryDistance: z.number().describe('The delivery distance in kilometers.'),
  currentOrders: z.number().describe('The number of current orders the cook is processing.'),
  timeOfOrder: z.string().describe('The time the order was placed.'),
  cookSpecialties: z.string().describe('The cook’s culinary expertise and specialties.'),
  customerAddress: z.string().describe('The customer’s delivery address.'),
});
export type EstimateDeliveryTimeInput = z.infer<typeof EstimateDeliveryTimeInputSchema>;

const EstimateDeliveryTimeOutputSchema = z.object({
  estimatedDeliveryTime: z.string().describe('The estimated delivery time, including time and date.'),
  reasoning: z.string().describe('The reasoning behind the estimated delivery time.'),
});
export type EstimateDeliveryTimeOutput = z.infer<typeof EstimateDeliveryTimeOutputSchema>;

export async function estimateDeliveryTime(input: EstimateDeliveryTimeInput): Promise<EstimateDeliveryTimeOutput> {
  return estimateDeliveryTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateDeliveryTimePrompt',
  input: {schema: EstimateDeliveryTimeInputSchema},
  output: {schema: EstimateDeliveryTimeOutputSchema},
  prompt: `You are a delivery time estimation expert. Consider the following factors to estimate the delivery time for an order:

- Cook Availability: {{{cookAvailability}}}
- Preparation Time: {{{preparationTime}}} minutes
- Delivery Distance: {{{deliveryDistance}}} kilometers
- Current Orders: {{{currentOrders}}}
- Time of Order: {{{timeOfOrder}}}
- Cook Specialties: {{{cookSpecialties}}}
- Customer Address: {{{customerAddress}}}

Provide an estimated delivery time, including the time and date, and explain your reasoning.
`,
});

const estimateDeliveryTimeFlow = ai.defineFlow(
  {
    name: 'estimateDeliveryTimeFlow',
    inputSchema: EstimateDeliveryTimeInputSchema,
    outputSchema: EstimateDeliveryTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
