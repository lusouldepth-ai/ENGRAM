import { generateSpeech, Accent } from '@/app/actions/tts-action';

// Singleton Audio Context
let audioContext: AudioContext | null = null;

// Simple in-memory cache for TTS audio buffers
// Key: `${text}-${accent}` (speed is applied during playback, not generation)
const ttsCache = new Map<string, AudioBuffer>();

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
 * Plays text using Gemini High-Quality TTS via Server Action
 */
export const playHighQualitySpeech = async (text: string, accent: Accent = 'US', speed: number = 1.0): Promise<void> => {

    // Stop any existing browser TTS first
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    try {
        const ctx = await getAudioContext();
        const cacheKey = `${text.trim()}-${accent}`;
        
        if (ttsCache.has(cacheKey)) {
            console.log('TTS: Cache hit for', cacheKey);
            const audioBuffer = ttsCache.get(cacheKey)!;
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speed;
            source.connect(ctx.destination);
            source.start();
            
            return new Promise((resolve) => {
                source.onended = () => resolve();
            });
        }

        // Call Server Action to generate speech
        const result = await generateSpeech(text, accent);

        if (!result.success || !result.audioData) {
             if (result.error === "QUOTA_EXCEEDED") {
                alert("Gemini TTS Limit Reached: You have exceeded the free tier usage limit. Please wait a moment.");
             } else {
                console.error("TTS Generation failed:", result.error);
                // alert("TTS Error: " + result.error);
             }
             return;
        }

        const bytes = base64ToBytes(result.audioData);
        const audioBuffer = await convertPCMToAudioBuffer(bytes, ctx, 24000);
        
        // Store in cache
        ttsCache.set(cacheKey, audioBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speed;
        source.connect(ctx.destination);
        source.start();

        console.log('TTS: Playing audio successfully');

        // Return a promise that resolves when audio ends
        return new Promise((resolve) => {
            source.onended = () => {
                console.log('TTS: Audio playback ended');
                resolve();
            };
        });

    } catch (error: any) {
        console.error("TTS failed:", error);
        // alert("TTS Error: " + (error instanceof Error ? error.message : String(error)));
    }
};
