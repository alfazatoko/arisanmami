'use server';
/**
 * @fileOverview An AI agent for generating personalized reminder messages for Arisan participants.
 *
 * - generateArisanReminders - A function that handles the reminder generation process.
 * - GenerateArisanRemindersInput - The input type for the generateArisanReminders function.
 * - GenerateArisanRemindersOutput - The return type for the generateArisanReminders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArisanRemindersInputSchema = z.object({
  groupName: z.string().describe('The name of the Arisan group.'),
  participants: z
    .array(
      z.object({
        name: z.string().describe('The name of the participant.'),
        additionalContext: z
          .string()
          .optional()
          .describe(
            'Any specific context or status for this participant, e.g., "pending payment", "won last month", "new member".'
          ),
      })
    )
    .describe('A list of Arisan participants with optional contextual information.'),
  eventType: z
    .enum(['contribution', 'drawing'])
    .describe('The type of event for which to generate a reminder (contribution or drawing).'),
  eventDate: z.string().describe('The date of the upcoming event (e.g., "2024-10-26").'),
  contributionAmount: z
    .number()
    .optional()
    .describe('The contribution amount, if the eventType is "contribution".'),
  additionalInfo: z
    .string()
    .optional()
    .describe('Any general additional information to include in all reminders.'),
});
export type GenerateArisanRemindersInput = z.infer<
  typeof GenerateArisanRemindersInputSchema
>;

const GenerateArisanRemindersOutputSchema = z.object({
  reminders: z
    .array(
      z.object({
        participantName: z.string().describe('The name of the participant.'),
        message:
          z.string().describe('The personalized reminder message for this participant.'),
      })
    )
    .describe('An array of personalized reminder messages for each participant.'),
});
export type GenerateArisanRemindersOutput = z.infer<
  typeof GenerateArisanRemindersOutputSchema
>;

export async function generateArisanReminders(
  input: GenerateArisanRemindersInput
): Promise<GenerateArisanRemindersOutput> {
  return generateArisanRemindersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateArisanRemindersPrompt',
  input: {schema: GenerateArisanRemindersInputSchema},
  output: {schema: GenerateArisanRemindersOutputSchema},
  prompt: `You are an assistant that generates personalized reminder messages for Arisan participants.

Generate a reminder for each participant in the 'participants' list for the upcoming '{{eventType}}' event of the Arisan group '{{groupName}}' on {{eventDate}}.

If the event type is 'contribution', mention that the contribution amount is {{{contributionAmount}}} Rupiah.

Craft each message to be friendly, clear, and encouraging. Consider any 'additionalContext' provided for each participant to make the message more personalized and relevant to their specific situation. If no specific context is provided for a participant, generate a general reminder for them.

Also, include the following general information in all reminders if provided: "{{{additionalInfo}}}"

Output your response as a JSON array of objects, where each object has 'participantName' and 'message' fields.

Participants:
{{#each participants}}
- Name: {{{name}}}{{#if additionalContext}} (Context: {{{additionalContext}}}){{/if}}
{{/each}}

Example for 'contribution' event and two participants, one with context, one without:
Input:
{
  "groupName": "Arisan Seruni",
  "participants": [
    {"name": "Ibu Ani", "additionalContext": "pending last contribution"},
    {"name": "Ibu Budi"}
  ],
  "eventType": "contribution",
  "eventDate": "2024-10-26",
  "contributionAmount": 100000,
  "additionalInfo": "Don't forget to bring snacks!"
}

Output:
{
  "reminders": [
    {
      "participantName": "Ibu Ani",
      "message": "Halo Ibu Ani, mohon diingat bahwa kontribusi Arisan Seruni sebesar Rp100.000 untuk tanggal 26 Oktober 2024 sudah jatuh tempo. Mohon segera diselesaikan ya. Jangan lupa bawa cemilan! Terima kasih."
    },
    {
      "participantName": "Ibu Budi",
      "message": "Halo Ibu Budi, jangan lupa ya kontribusi Arisan Seruni sebesar Rp100.000 untuk tanggal 26 Oktober 2024. Jangan lupa bawa cemilan! Terima kasih."
    }
  ]
}

Example for 'drawing' event:
Input:
{
  "groupName": "Arisan Melati",
  "participants": [
    {"name": "Ibu Cici", "additionalContext": "won last month"},
    {"name": "Ibu Dede"}
  ],
  "eventType": "drawing",
  "eventDate": "2024-11-15",
  "additionalInfo": "Dress code: batik"
}

Output:
{
  "reminders": [
    {
      "participantName": "Ibu Cici",
      "message": "Halo Ibu Cici, ingat ya, pengundian Arisan Melati akan dilaksanakan pada tanggal 15 November 2024. Meskipun sudah menang bulan lalu, kehadiran Ibu tetap ditunggu untuk meramaikan. Jangan lupa pakai batik ya! Sampai jumpa."
    },
    {
      "participantName": "Ibu Dede",
      "message": "Halo Ibu Dede, jangan lewatkan pengundian Arisan Melati yang akan dilaksanakan pada tanggal 15 November 2024. Semoga beruntung! Jangan lupa pakai batik ya! Sampai jumpa."
    }
  ]
}
`,
});

const generateArisanRemindersFlow = ai.defineFlow(
  {
    name: 'generateArisanRemindersFlow',
    inputSchema: GenerateArisanRemindersInputSchema,
    outputSchema: GenerateArisanRemindersOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
