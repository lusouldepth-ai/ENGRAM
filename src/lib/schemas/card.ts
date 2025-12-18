import { z } from "zod";

export const cardSchema = z.object({
  front: z.string().describe("The word or phrase in the target language."),
  phonetic: z.string().describe("IPA phonetic transcription."),
  pos: z.string().describe("Part of speech (e.g., n., v., adj.)."),
  translation: z.string().describe("Translation in the user's native language."),
  definition: z.string().describe("Concise definition in the target language."),
  example: z.string().describe("A sample sentence using the word."),
});

export const generateResponseSchema = z.object({
  cards: z.array(cardSchema),
});

export type GeneratedCard = z.infer<typeof cardSchema>;

