'use server';
/**
 * @fileOverview A Genkit flow to generate a fun and personalized announcement message for an arisan winner.
 *
 * - generateWinnerAnnouncement - A function that generates the winner announcement message.
 * - GenerateWinnerAnnouncementInput - The input type for the generateWinnerAnnouncement function.
 * - GenerateWinnerAnnouncementOutput - The return type for the generateWinnerAnnouncement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWinnerAnnouncementInputSchema = z.object({
  winnerName: z.string().describe('The name of the arisan winner.'),
  groupName: z.string().describe('The name of the arisan group.'),
  fairDrawingProcessExplanation: z.string().describe('A brief explanation of how the winner was fairly selected, ensuring transparency.'),
});
export type GenerateWinnerAnnouncementInput = z.infer<typeof GenerateWinnerAnnouncementInputSchema>;

const GenerateWinnerAnnouncementOutputSchema = z.object({
  announcementMessage: z.string().describe('A fun and personalized announcement message for the winner, explaining the fair drawing process.'),
});
export type GenerateWinnerAnnouncementOutput = z.infer<typeof GenerateWinnerAnnouncementOutputSchema>;

export async function generateWinnerAnnouncement(input: GenerateWinnerAnnouncementInput): Promise<GenerateWinnerAnnouncementOutput> {
  return generateWinnerAnnouncementFlow(input);
}

const generateWinnerAnnouncementPrompt = ai.definePrompt({
  name: 'generateWinnerAnnouncementPrompt',
  input: {schema: GenerateWinnerAnnouncementInputSchema},
  output: {schema: GenerateWinnerAnnouncementOutputSchema},
  prompt: `You are a fun and friendly Arisan announcement generator. Your task is to create a personalized announcement message for the arisan winner, formatted as a JSON object matching the provided schema.

Here's the information you need:
- Winner Name: {{{winnerName}}}
- Group Name: {{{groupName}}}
- Fair Drawing Process Explanation: {{{fairDrawingProcessExplanation}}}

Your announcement should:
1.  Congratulate the winner enthusiastically.
2.  Mention the Arisan group name.
3.  Briefly explain the fair drawing process to ensure transparency.
4.  Be celebratory and engaging.

Example of desired output format:
\`\`\`json
{
  "announcementMessage": "🎉 Selamat kepada [Winner Name] dari Arisan [Group Name]! Setelah melalui proses pengundian yang [explanation of fair process], [Winner Name] menjadi pemenang berikutnya! Mari kita rayakan bersama!"
}
\`\`\`

Now, generate the announcement message in the specified JSON format based on the provided details.`,
});

const generateWinnerAnnouncementFlow = ai.defineFlow(
  {
    name: 'generateWinnerAnnouncementFlow',
    inputSchema: GenerateWinnerAnnouncementInputSchema,
    outputSchema: GenerateWinnerAnnouncementOutputSchema,
  },
  async (input) => {
    const {output} = await generateWinnerAnnouncementPrompt(input);
    if (!output) {
        throw new Error("Failed to generate announcement message.");
    }
    return output;
  }
);
