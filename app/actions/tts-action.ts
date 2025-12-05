'use server';

import { GoogleGenAI, Modality } from "@google/genai";

export type Accent = 'US' | 'UK';

type SpeechResult =
    | { success: true; audioData: string; mimeType: 'audio/raw' | 'audio/mpeg' }
    | { success: false; error: string };

const ELEVEN_DEFAULT_VOICE_US = '21m00Tcm4TlvDq8ikWAM'; // Sarah (美式)
const ELEVEN_DEFAULT_VOICE_UK = 'TxGEqnHWrfWFTfGW9XjX'; // Bella (英式)

async function generateSpeechWithGemini(text: string, accent: Accent): Promise<SpeechResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    console.log("🔊 [TTS:Gemini] Generating speech for:", text.substring(0, 30));
    console.log("🔊 [TTS:Gemini] API Key exists:", !!apiKey, "Length:", apiKey.length);
    
    if (!apiKey) {
        console.error("🔊 [TTS:Gemini] API Key is missing!");
        return { success: false, error: "API Key is missing" };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const voiceName = accent === 'US' ? 'Kore' : 'Puck';
        
        console.log("🔊 [TTS:Gemini] Using voice:", voiceName, "for accent:", accent);

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
        
        console.log("🔊 [TTS:Gemini] Audio data exists:", !!base64Audio);
        console.log("🔊 [TTS:Gemini] Audio data length:", base64Audio?.length || 0);
        
        if (base64Audio) {
            // Gemini 返回 raw PCM
            return { success: true, audioData: base64Audio, mimeType: 'audio/raw' };
        } else {
            console.error("🔊 [TTS:Gemini] No audio data in response structure");
            return { success: false, error: "No audio data received" };
        }

    } catch (error: any) {
        console.error("🔊 [TTS:Gemini] Failed:", error);
        if (error?.message?.includes('429') || error?.status === 429 || error?.code === 429 || JSON.stringify(error).includes('429')) {
            return { success: false, error: "QUOTA_EXCEEDED" };
        }
        return { success: false, error: error.message || String(error) };
    }
}

async function generateSpeechWithElevenLabs(text: string, accent: Accent): Promise<SpeechResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return { success: false, error: "ELEVEN_API_KEY_MISSING" };

    const voiceId = accent === 'UK' ? ELEVEN_DEFAULT_VOICE_UK : ELEVEN_DEFAULT_VOICE_US;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.4,
                    similarity_boost: 0.8,
                }
            })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            console.error("🔊 [TTS:11labs] HTTP error", resp.status, errText);
            return { success: false, error: `ELEVEN_HTTP_${resp.status}` };
        }

        const arrayBuffer = await resp.arrayBuffer();
        const bytes = Buffer.from(arrayBuffer);
        const base64Audio = bytes.toString('base64');
        return { success: true, audioData: base64Audio, mimeType: 'audio/mpeg' };
    } catch (error: any) {
        console.error("🔊 [TTS:11labs] Failed:", error);
        return { success: false, error: error.message || String(error) };
    }
}

export async function generateSpeech(text: string, accent: Accent = 'US'): Promise<SpeechResult> {
    // 优先使用 ElevenLabs（若配置），否则回落 Gemini
    if (process.env.ELEVENLABS_API_KEY) {
        const eleven = await generateSpeechWithElevenLabs(text, accent);
        if (eleven.success) return eleven;
        console.warn("🔊 [TTS] ElevenLabs failed, fallback to Gemini:", eleven.error);
    }
    return generateSpeechWithGemini(text, accent);
}

