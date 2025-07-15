'use server';
/**
 * @fileOverview A flow for estimating food preparation start time.
 *
 * - estimatePrepStartTime - A function that estimates when a cook should start preparing food.
 * - EstimatePrepStartTimeInput - The input type for the function.
 * - EstimatePrepStartTimeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimatePrepStartTimeInputSchema = z.object({
  cookAddress: z.string().describe('The address of the cook.'),
  customerAddress: z.string().describe('The delivery address of the customer.'),
  prepTimeMinutes: z
    .number()
    .describe('The number of minutes required to prepare the dish.'),
});
export type EstimatePrepStartTimeInput = z.infer<
  typeof EstimatePrepStartTimeInputSchema
>;

const EstimatePrepStartTimeOutputSchema = z.object({
  estimatedDriverArrivalTime: z
    .string()
    .describe(
      'The estimated time the driver will arrive at the cook\'s location, in HH:MM AM/PM format.'
    ),
  recommendedPrepStartTime: z
    .string()
    .describe(
      "The recommended time the cook should start preparing the food, in HH:MM AM/PM format, calculated by subtracting the prep time from the driver's arrival time."
    ),
});
export type EstimatePrepStartTimeOutput = z.infer<
  typeof EstimatePrepStartTimeOutputSchema
>;

export async function estimatePrepStartTime(
  input: EstimatePrepStartTimeInput
): Promise<EstimatePrepStartTimeOutput> {
  return estimatePrepStartTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimatePrepStartTimePrompt',
  input: {schema: EstimatePrepStartTimeInputSchema},
  output: {schema: EstimatePrepStartTimeOutputSchema},
  prompt: `You are an expert logistics coordinator for a food delivery service. Your task is to calculate the ideal time for a cook to start preparing an order to minimize wait time and ensure the food is hot upon the driver's arrival.

Current Time: ${new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}

Inputs:
- Cook's Location: {{{cookAddress}}}
- Customer's Location: {{{customerAddress}}}
- Dish Preparation Time: {{{prepTimeMinutes}}} minutes

Instructions:
1. Estimate the travel time for a delivery driver to get from their standby location (assume a central point in the city) to the cook's address ({{{cookAddress}}}). Factor in typical urban traffic, but you don't need real-time data. A reasonable estimate is fine.
2. Calculate the "Estimated Driver Arrival Time" at the cook's location.
3. Subtract the "Dish Preparation Time" from the "Estimated Driver Arrival Time" to determine the "Recommended Prep Start Time".
4. Return both times in HH:MM AM/PM format.`,
});

const estimatePrepStartTimeFlow = ai.defineFlow(
  {
    name: 'estimatePrepStartTimeFlow',
    inputSchema: EstimatePrepStartTimeInputSchema,
    outputSchema: EstimatePrepStartTimeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
