import { GoogleGenAI, Modality } from "@google/genai";

export type Accent = 'US' | 'UK';

// Initialize Gemini API
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

// Singleton Audio Context
let audioContext: AudioContext | null = null;

const getAudioContext = async () => {
    if (!audioContext) {
        // Gemini TTS native sample rate is 24000Hz
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    // Resume context if suspended (required by browser security policy)
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
            console.log('AudioContext resumed successfully');
        } catch (error) {
            console.warn('Failed to resume AudioContext:', error);
        }
    }

    return audioContext;
};

// Helper: Decode Base64 string to Uint8Array
function base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper: Manually Decode Raw PCM Audio Data (Int16 -> Float32)
// Gemini API returns raw PCM data without headers.
async function convertPCMToAudioBuffer(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
): Promise<AudioBuffer> {

    // Ensure even byte length for Int16Array
    let alignedData = data;
    if (data.byteLength % 2 !== 0) {
        alignedData = data.slice(0, data.byteLength - 1);
    }

    const dataInt16 = new Int16Array(alignedData.buffer, alignedData.byteOffset, alignedData.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

/**
 * Plays text using Gemini High-Quality TTS with fallback to browser SpeechSynthesis
 */
export const playHighQualitySpeech = async (text: string, accent: Accent = 'US', speed: number = 1.0): Promise<void> => {

    // Stop any existing browser TTS first
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    // 1. Try Gemini TTS if API Key exists
    if (ai) {
        try {
            // Map accents to specific voices
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
                const ctx = await getAudioContext();
                const bytes = base64ToBytes(base64Audio);

                // Decode the raw PCM data using our manual helper, NOT ctx.decodeAudioData
                const audioBuffer = await convertPCMToAudioBuffer(bytes, ctx, 24000);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.playbackRate.value = speed;
                source.connect(ctx.destination);
                source.start();

                console.log('Gemini TTS: Playing audio successfully');

                // Return a promise that resolves when audio ends
                return new Promise((resolve) => {
                    source.onended = () => {
                        console.log('Gemini TTS: Audio playback ended');
                        resolve();
                    };
                });
            }
        } catch (error) {
            console.warn("Gemini TTS failed (using fallback):", error);
            // Fall through to browser backup
        }
    }

    // 2. Fallback to Browser SpeechSynthesis
    // Ensure we cancel again before starting fallback (in case Gemini partially started)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    return new Promise((resolve, reject) => {
        window.speechSynthesis.cancel(); // Cancel one more time to be sure

        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to find a matching system voice
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (accent === 'UK') {
            selectedVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('British'));
        } else {
            selectedVoice = voices.find(v => v.lang === 'en-US' || v.name.includes('US') || v.name.includes('United States'));
        }

        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = speed;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
            console.error("Browser TTS error", e);
            resolve(); // Resolve anyway to ensure UI doesn't hang
        };

        window.speechSynthesis.speak(utterance);
    });
};
