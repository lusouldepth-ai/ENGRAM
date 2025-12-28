import { generateSpeech, Accent } from '@/app/actions/tts-action';

// Singleton Audio Context
let audioContext: AudioContext | null = null;

// Simple in-memory cache for TTS audio buffers
// Key: `${text}-${accent}` (speed is applied during playback, not generation)
const ttsCache = new Map<string, AudioBuffer>();

const getAudioContext = async () => {
    if (!audioContext) {
        // Use default device sample rate for broader compatibility
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume context if suspended (required by browser security policy)
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
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
        // 确保在用户点击后音频上下文已恢复
        if (ctx.state !== 'running') {
            try {
                await ctx.resume();
            } catch (e) {
                console.warn('AudioContext resume failed:', e);
            }
        }
        if (ctx.state !== 'running') {
            console.warn('AudioContext not running; TTS playback may be blocked by browser.');
        }
        const cacheKey = `${text.trim()}-${accent}`;

        if (ttsCache.has(cacheKey)) {
            const audioBuffer = ttsCache.get(cacheKey)!;

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speed;
            source.connect(ctx.destination);
            source.start();

            return new Promise((resolve) => {
                source.onended = () => {
                    resolve();
                };
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
            fallbackToBrowserTTS(text, speed);
            return;
        }

        const bytes = base64ToBytes(result.audioData);
        let audioBuffer: AudioBuffer;

        if (result.mimeType === 'audio/raw') {
            audioBuffer = await convertPCMToAudioBuffer(bytes, ctx, 24000);
        } else {
            // audio/mpeg or other compressed formats
            audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        }

        // Store in cache (include mimeType in key to avoid mismatch)
        ttsCache.set(`${cacheKey}-${result.mimeType}`, audioBuffer);

        // Ensure context is running just before playback
        if (ctx.state !== 'running') {
            try {
                await ctx.resume();
            } catch (e) {
                console.warn('AudioContext resume failed before playback:', e);
            }
        }

        // Create a gain node to avoid 0-volume edge cases and to allow future control
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        gainNode.connect(ctx.destination);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speed;
        source.connect(gainNode);
        source.start();

        // Return a promise that resolves when audio ends
        return new Promise((resolve) => {
            source.onended = () => {
                resolve();
            };
        });

    } catch (error: any) {
        console.error("TTS failed:", error);
        fallbackToBrowserTTS(text, speed);
    }
};

const fallbackToBrowserTTS = (text: string, speed: number) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        // Try to select an English voice
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;

        window.speechSynthesis.speak(utterance);
    }
};
