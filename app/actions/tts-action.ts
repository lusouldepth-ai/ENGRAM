'use server';

import { GoogleGenAI, Modality } from "@google/genai";

export type Accent = 'US' | 'UK';

export async function generateSpeech(text: string, accent: Accent = 'US') {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    
    if (!apiKey) {
        return { success: false, error: "API Key is missing" };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const voiceName = accent === 'US' ? 'Kore' : 'Puck';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceName
                        },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            return { success: true, audioData: base64Audio };
        } else {
            return { success: false, error: "No audio data received" };
        }

    } catch (error: any) {
        console.error("Gemini TTS Server Action failed:", error);
        
        // Pass through 429 errors specifically
        if (error?.message?.includes('429') || error?.status === 429 || error?.code === 429 || JSON.stringify(error).includes('429')) {
            return { success: false, error: "QUOTA_EXCEEDED" };
        }
        
        return { success: false, error: error.message || String(error) };
    }
}

