'use server';
/**
 * @fileOverview A flow for estimating travel distance between two points.
 *
 * - estimateTravelDistance - A function that estimates the distance between two addresses.
 * - EstimateTravelDistanceInput - The input type for the function.
 * - EstimateTravelDistanceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateTravelDistanceInputSchema = z.object({
  startAddress: z.string().describe('The starting address.'),
  endAddress: z.string().describe('The destination address.'),
});
export type EstimateTravelDistanceInput = z.infer<
  typeof EstimateTravelDistanceInputSchema
>;

const EstimateTravelDistanceOutputSchema = z.object({
  distanceKm: z
    .number()
    .describe(
      'The estimated driving distance between the two addresses in kilometers.'
    ),
});
export type EstimateTravelDistanceOutput = z.infer<
  typeof EstimateTravelDistanceOutputSchema
>;

export async function estimateTravelDistance(
  input: EstimateTravelDistanceInput
): Promise<EstimateTravelDistanceOutput> {
  return estimateTravelDistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateTravelDistancePrompt',
  input: {schema: EstimateTravelDistanceInputSchema},
  output: {schema: EstimateTravelDistanceOutputSchema},
  prompt: `You are a helpful logistics assistant. Your task is to estimate the driving distance in kilometers between a start and end address.

Inputs:
- Start Address: {{{startAddress}}}
- End Address: {{{endAddress}}}

Instructions:
1.  Based on the two addresses provided, provide a reasonable estimate for the driving distance in kilometers.
2.  Factor in that these are urban addresses. A straight line is not accurate; consider typical road layouts.
3.  Return only the estimated distance in the 'distanceKm' field.`,
});

const estimateTravelDistanceFlow = ai.defineFlow(
  {
    name: 'estimateTravelDistanceFlow',
    inputSchema: EstimateTravelDistanceInputSchema,
    outputSchema: EstimateTravelDistanceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
