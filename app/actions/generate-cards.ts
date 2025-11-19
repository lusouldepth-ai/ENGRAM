'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const cardSchema = z.object({
  front: z.string().describe("The target vocabulary word or phrase."),
  phonetic: z.string().describe("The IPA phonetic transcription."),
  pos: z.string().describe("Part of speech (e.g., n., v., adj.)."),
  translation: z.string().describe("Translation in the user's native language (assume Chinese/User's Locale)."),
  definition: z.string().describe("Concise definition in the target language (English)."),
  example: z.string().describe("A usage example sentence."),
});

export const generateCards = async (input: string) => {
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-pro-latest'), // Using 1.5 Pro as 3.0 is mentioned in PRD but mapping to available SDK model.
      schema: z.object({
        cards: z.array(cardSchema),
      }),
      system: `You are the engine behind ENGRAM, a high-end language learning tool.
Goal: Extract vocabulary and format it into a strict JSON array.

Rules:
1. Selection: If input is text, extract the top 15 most valuable/challenging words (CEFR B2+). If input is a list, process the list.
2. Simplicity: Definitions must be concise. No fluff. "Less but Better".
3. Language: Front=Target Language (English). Back Translation=Chinese (Simplified). Back Definition=Target Language (English).

JSON Output Structure is defined by the schema.`,
      prompt: input,
    });

    return { success: true, data: object.cards };
  } catch (error) {
    console.error("Error generating cards:", error);
    return { success: false, error: "Failed to generate cards." };
  }
};
