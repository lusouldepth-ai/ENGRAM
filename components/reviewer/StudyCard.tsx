'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Database } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, RefreshCw, Mic, Volume2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { regenerateShadowSentence } from '@/app/actions/shadow-actions';

type Card = Database['public']['Tables']['cards']['Row'] & {
  audio_url?: string | null;
};

interface StudyCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: (flipped: boolean) => void;
  onResultChange?: (result: { correct: boolean; input: string }) => void;
  userTier?: string | null;
  accentPreference?: string | null;
  shadowRate?: number | null;
}

export function StudyCard({
  card,
  isFlipped,
  onFlip,
  onResultChange,
  userTier,
  accentPreference,
  shadowRate: shadowRateProp,
}: StudyCardProps) {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shadowSentence, setShadowSentence] = useState(card.shadow_sentence || '');
  const accent: 'us' | 'uk' = accentPreference?.toLowerCase() === 'uk' ? 'uk' : 'us';
  const [resolvedShadowRate, setResolvedShadowRate] = useState(() => {
    const val = shadowRateProp ?? 0.95;
    return Math.min(1.2, Math.max(0.8, val));
  });
  const isPro = (userTier || '').toLowerCase() === 'pro';
  const [isShuffling, startShuffle] = useTransition();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShadowSpeaking, setIsShadowSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const shadowUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [voicesReady, setVoicesReady] = useState(false);
  const router = useRouter();
  const rawTarget = (card.front || '').trim();
  const isAllCaps = rawTarget && rawTarget === rawTarget.toUpperCase();
  const displayTarget = isAllCaps ? rawTarget : rawTarget.toLowerCase();

  // Phase 1: Auto-play (Mock)
  useEffect(() => {
    if (!isFlipped && voicesReady) {
      inputRef.current?.focus();
      handlePlay();
    }
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, isFlipped, voicesReady]);

  useEffect(() => {
    setUserInput('');
    setIsCorrect(null);
    setShadowSentence(card.shadow_sentence || '');
    stopAudio();
  }, [card]);

  useEffect(() => {
    if (shadowRateProp !== undefined && shadowRateProp !== null) {
      setResolvedShadowRate(Math.min(1.2, Math.max(0.8, shadowRateProp)));
    }
  }, [shadowRateProp]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const preferred = voices.find((voice) =>
        accent === 'uk'
          ? voice.lang.toLowerCase().includes('en-gb')
          : voice.lang.toLowerCase().includes('en-us')
      );
      const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));
      voiceRef.current = preferred || fallback || null;
      setVoicesReady(true);
    };

    assignVoice();
    window.speechSynthesis.addEventListener('voiceschanged', assignVoice);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', assignVoice);
    };
  }, [accent]);

  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isFlipped) {
      const cleanInput = userInput.trim().toLowerCase();
      const cleanTarget = rawTarget.toLowerCase();
      const result = cleanInput === cleanTarget;
      setIsCorrect(result);
      onResultChange?.({ correct: result, input: userInput });
      onFlip(true);
    }
  };

  const handleShuffle = () => {
    if (!isPro) {
      router.push('/pricing');
      return;
    }
    startShuffle(async () => {
      const result = await regenerateShadowSentence(card.id);
      if (result.success && result.sentence) {
        setShadowSentence(result.sentence);
      } else {
        alert(result.error || 'Unable to refresh sentence');
      }
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    if (typeof window !== 'undefined' && shadowUtteranceRef.current) {
      window.speechSynthesis.cancel();
      shadowUtteranceRef.current = null;
      setIsShadowSpeaking(false);
    }
    setIsSpeaking(false);
  };

  const buildFallbackAudioUrl = () => {
    const word = encodeURIComponent(rawTarget || card.front || '');
    if (!word) return null;
    const type = accent === 'uk' ? '1' : '0';
    return `https://dict.youdao.com/dictvoice?type=${type}&audio=${word}`;
  };

  const handlePlay = () => {
    stopAudio();

    if (card.audio_url) {
      const audio = new Audio(card.audio_url);
      audioRef.current = audio;
      audio
        .play()
        .then(() => setIsSpeaking(true))
        .catch((err) => console.warn('Audio playback failed', err));
      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        audioRef.current = null;
      });
      return;
    }

    const fallbackUrl = buildFallbackAudioUrl();
    if (fallbackUrl) {
      const fallbackAudio = new Audio(fallbackUrl);
      audioRef.current = fallbackAudio;
      fallbackAudio
        .play()
        .then(() => setIsSpeaking(true))
        .catch((err) => {
          console.warn('Fallback audio failed', err);
          speakViaWebAPI();
        });
      fallbackAudio.addEventListener('ended', () => {
        setIsSpeaking(false);
        audioRef.current = null;
      });
      return;
    }

    speakViaWebAPI();
  };

  const speakViaWebAPI = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(rawTarget || card.front);
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    utterance.rate = resolvedShadowRate;
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
    setIsSpeaking(true);
  };

  const handleShadowPlay = () => {
    if (!shadowSentence) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!isPro) {
      router.push('/pricing');
      return;
    }
    if (isShadowSpeaking) {
      window.speechSynthesis.cancel();
      setIsShadowSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(shadowSentence);
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    utterance.rate = resolvedShadowRate;
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    utterance.onend = () => {
      setIsShadowSpeaking(false);
      shadowUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsShadowSpeaking(false);
      shadowUtteranceRef.current = null;
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    shadowUtteranceRef.current = utterance;
    setIsShadowSpeaking(true);
  };

  const handleRecordToggle = async () => {
    if (!isPro) {
      router.push('/pricing');
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed', err);
      alert('Microphone access denied.');
    }
  };

  return (
    <div
      className="relative w-full max-w-md h-[400px]"
      style={{ perspective: '1600px' }}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT: Dictation Mode */}
        <div
          className="absolute w-full h-full bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="mb-8">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Play pronunciation"
              onClick={handlePlay}
              className={cn(
                'rounded-full h-12 w-12 bg-gray-50 hover:bg-gray-100 transition-colors',
                isSpeaking && 'bg-[#EA580C]/10 text-[#EA580C]'
              )}
            >
              <Volume2 className={cn('w-6 h-6', isSpeaking ? 'text-[#EA580C]' : 'text-gray-600')} />
            </Button>
          </div>
          
          <Input 
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleSubmit}
            placeholder="Type what you hear..."
            className="text-center text-xl font-medium border-0 border-b-2 border-gray-200 rounded-none focus-visible:ring-0 focus-visible:border-braun-accent px-4 py-2 bg-transparent placeholder:text-gray-300"
          />
          
          <p className="mt-4 text-xs text-gray-400">Press Enter to flip</p>
        </div>

        {/* BACK: Feedback Mode */}
        <div 
          className="absolute w-full h-full bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col p-8 overflow-y-auto no-scrollbar"
          style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
        >
          {/* Result Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-braun-text mb-1">
              <DiffResult input={userInput} target={displayTarget} rawTarget={rawTarget} />
            </h2>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">{card.phonetic || "/.../"}</span>
              <span className="italic">{card.pos || "n."}</span>
            </div>
            {!isCorrect && (
               <p className="text-base text-orange-600 mt-3 font-semibold tracking-tight">
                 Correct: {displayTarget}
               </p>
            )}
          </div>

          {/* Context Content */}
          <div className="space-y-6 flex-1">
            
            {/* Definition */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meaning</h4>
              <p className="text-gray-800 leading-relaxed">
                {card.definition}
                <span className="block text-gray-400 text-sm mt-1">{card.translation}</span>
              </p>
            </div>

            {card.example && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sentence</h4>
                <p className="text-gray-700 leading-relaxed">{card.example}</p>
              </div>
            )}

            {/* Shadow Sentence (Pro Feature) */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shadowing</h4>
                 {isPro ? (
                   <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">PRO</span>
                 ) : (
                   <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Pro Only</span>
                 )}
               </div>

               <div
                 className={cn(
                   'relative transition-all',
                   !isPro && 'group cursor-pointer'
                 )}
                 onClick={() => {
                   if (!isPro) router.push('/pricing');
                 }}
               >
                  <p
                    className={cn(
                      'text-lg font-serif leading-relaxed transition-all',
                      !isPro && 'blur-sm select-none opacity-50'
                    )}
                  >
                    {shadowSentence || 'This is a long, rhythmic sentence designed for shadowing practice.'}
                  </p>
                  
                  {!isPro && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border flex items-center gap-2">
                            <Lock className="w-3 h-3 text-braun-accent" />
                            <span className="text-xs font-medium text-braun-text">Unlock Pro</span>
                        </div>
                    </div>
                  )}
               </div>

               {isPro && (
                 <div className="flex flex-wrap gap-3 items-center">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleShadowPlay}
                     className={cn(
                       'rounded-full px-4 py-2 text-sm font-medium',
                       isShadowSpeaking && 'border-[#EA580C] text-[#EA580C]'
                     )}
                   >
                     <Play className="w-4 h-4 mr-1" />
                     {isShadowSpeaking ? 'Playing...' : 'Play'}
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleRecordToggle}
                     className={cn(
                       'rounded-full px-4 py-2 text-sm font-medium',
                       isRecording && 'border-red-400 text-red-500'
                     )}
                   >
                     <Mic className="w-4 h-4 mr-1" />
                     {isRecording ? 'Recording...' : 'Record'}
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleShuffle}
                     disabled={isShuffling}
                     className="rounded-full px-4 py-2 text-sm font-medium"
                   >
                     {isShuffling ? (
                       'Shuffling...'
                     ) : (
                       <>
                         <RefreshCw className="w-4 h-4 mr-1" />
                         Shuffle
                       </>
                     )}
                   </Button>
                 </div>
               )}

               {recordedUrl && (
                 <div className="pt-2 text-sm text-gray-500">
                   <audio controls src={recordedUrl} className="w-full" />
                 </div>
               )}

            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple Diff Component
function DiffResult({
  input,
  target,
  rawTarget,
}: {
  input: string;
  target: string;
  rawTarget: string;
}) {
  const normalizedTarget = target || '';
  const normalizedInput = (input || '').toLowerCase();
  const isCorrect = normalizedInput.trim() === normalizedTarget.trim();

  if (isCorrect) {
    return <span className="text-green-600">{normalizedTarget}</span>;
  }

  return (
    <span className="tracking-wide text-[#1A1A1A] font-semibold">
      {normalizedTarget.split('').map((char, idx) => {
        const match = (normalizedInput[idx] || '').toLowerCase() === char.toLowerCase();
        return (
          <span
            key={`${rawTarget}-${idx}`}
            className={cn(
              'relative px-0.5 transition-colors',
              match
                ? 'text-[#1A1A1A]'
                : 'text-[#EA580C]'
            )}
          >
            {char}
            {!match && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-[2px] w-5/6 bg-[#EA580C]/40 rounded-full" />
            )}
          </span>
        );
      })}
    </span>
  );
}

