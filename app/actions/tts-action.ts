'use server';

import { GoogleGenAI, Modality } from "@google/genai";

export type Accent = 'US' | 'UK';

export async function generateSpeech(text: string, accent: Accent = 'US') {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    
    console.log("🔊 [TTS] Generating speech for:", text.substring(0, 30));
    console.log("🔊 [TTS] API Key exists:", !!apiKey, "Length:", apiKey.length);
    
    if (!apiKey) {
        console.error("🔊 [TTS] API Key is missing!");
        return { success: false, error: "API Key is missing" };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const voiceName = accent === 'US' ? 'Kore' : 'Puck';
        
        console.log("🔊 [TTS] Using voice:", voiceName, "for accent:", accent);

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

        console.log("🔊 [TTS] API Response received");
        console.log("🔊 [TTS] Has candidates:", !!response.candidates);
        
        if (response.candidates && response.candidates[0]) {
            console.log("🔊 [TTS] First candidate has content:", !!response.candidates[0].content);
            console.log("🔊 [TTS] Parts count:", response.candidates[0].content?.parts?.length || 0);
            
            if (response.candidates[0].content?.parts?.[0]) {
                const part = response.candidates[0].content.parts[0];
                console.log("🔊 [TTS] First part keys:", Object.keys(part));
                console.log("🔊 [TTS] Has inlineData:", !!(part as any).inlineData);
            }
        }

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        console.log("🔊 [TTS] Audio data exists:", !!base64Audio);
        console.log("🔊 [TTS] Audio data length:", base64Audio?.length || 0);
        
        if (base64Audio) {
            return { success: true, audioData: base64Audio };
        } else {
            console.error("🔊 [TTS] No audio data in response structure");
            return { success: false, error: "No audio data received" };
        }

    } catch (error: any) {
        console.error("🔊 [TTS] Gemini TTS Server Action failed:", error);
        
        // Pass through 429 errors specifically
        if (error?.message?.includes('429') || error?.status === 429 || error?.code === 429 || JSON.stringify(error).includes('429')) {
            return { success: false, error: "QUOTA_EXCEEDED" };
        }
        
        return { success: false, error: error.message || String(error) };
    }
}

