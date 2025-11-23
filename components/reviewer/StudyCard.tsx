'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Database } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { regenerateShadowSentence } from '@/app/actions/shadow-actions';
import { quickAddCard } from '@/app/actions/quick-add';
import { Plus } from 'lucide-react';
import { StudyCardFront } from './StudyCardFront';
import { StudyCardBack } from './StudyCardBack';

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
  uiLanguage?: string;
}

export function StudyCard({
  card,
  isFlipped,
  onFlip,
  onResultChange,
  userTier,
  accentPreference,
  shadowRate: shadowRateProp,
  uiLanguage,
}: StudyCardProps) {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shadowSentence, setShadowSentence] = useState(card.shadow_sentence || '');
  const accent: 'us' | 'uk' = accentPreference?.toLowerCase() === 'uk' ? 'uk' : 'us';
  const [resolvedShadowRate, setResolvedShadowRate] = useState(() => {
    const val = shadowRateProp ?? 0.95;
    return Math.min(1.2, Math.max(0.8, val));
  });
  const isPro = (userTier || '').trim().toLowerCase() === 'pro';
  console.log('StudyCard Debug:', { userTier, isPro, rawTier: userTier });
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

  // Quick Add State
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);

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

  const handleExamplePlay = (text: string) => {
    stopAudio();
    if (!text) return;

    // Gate High-Quality TTS behind Pro Plan
    if (!isPro) {
      speakViaWebAPI(text);
      return;
    }

    const playExternalTTS = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => reject();
        audio.play().catch(reject);
      });
    };

    const tryGoogle = () => {
      const q = encodeURIComponent(text);
      // Use Google Translate TTS (unofficial but high quality)
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${q}&tl=${accent === 'uk' ? 'en-GB' : 'en-US'}`;
      return playExternalTTS(url);
    };

    const tryYoudao = () => {
      const q = encodeURIComponent(text);
      const type = accent === 'uk' ? 1 : 0;
      const url = `https://dict.youdao.com/dictvoice?audio=${q}&type=${type}`;
      return playExternalTTS(url);
    };

    // Chain attempts: Google -> Youdao -> WebSpeech
    tryGoogle()
      .catch(() => tryYoudao())
      .catch(() => {
        console.warn('External TTS failed, falling back to Web Speech API');
        speakViaWebAPI(text);
      });
  };

  const speakViaWebAPI = (text: string = rawTarget || card.front) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity

    // Try to find a high quality voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = accent === 'uk'
      ? ['Google UK English Female', 'Google UK English Male', 'Daniel', 'Martha']
      : ['Google US English', 'Samantha', 'Alex', 'Fred'];

    const selectedVoice = voices.find(v => preferredVoices.includes(v.name)) ||
      voices.find(v => v.lang.includes(accent === 'uk' ? 'en-GB' : 'en-US'));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
    // Only set isSpeaking if it's the main word (to avoid confusion with example button state if we tracked it separately)
    // But for now, we don't track example playing state explicitly in UI other than audioRef
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

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionRect(null);
      setSelectedText(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0 && text.length < 50) { // Limit length
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      // Calculate relative position if needed, or use fixed/absolute
      // For simplicity, let's use fixed positioning based on viewport
      setSelectionRect({ top: rect.top - 40, left: rect.left + (rect.width / 2) });
      setSelectedText(text);
    } else {
      setSelectionRect(null);
      setSelectedText(null);
    }
  };

  const handleQuickAdd = async () => {
    if (!selectedText) return;
    setIsAddingCard(true);
    const result = await quickAddCard(selectedText);
    setIsAddingCard(false);
    setSelectionRect(null);
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();

    if (result.success) {
      alert(`Added "${selectedText}" to your deck!`);
    } else {
      alert(`Failed to add card: ${result.error}`);
    }
  };

  return (
    <div
      className="relative w-full max-w-md h-[500px]" // Increased height for more content
      style={{ perspective: '1600px' }}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT */}
        <StudyCardFront
          ref={inputRef}
          userInput={userInput}
          setUserInput={setUserInput}
          handleSubmit={handleSubmit}
          handlePlay={handlePlay}
          isSpeaking={isSpeaking}
          isCorrect={isCorrect}
        />

        {/* BACK */}
        <StudyCardBack
          card={card}
          userInput={userInput}
          displayTarget={displayTarget}
          rawTarget={rawTarget}
          isCorrect={isCorrect}
          handleSelection={handleSelection}
          handleExamplePlay={handleExamplePlay}
          shadowSentence={shadowSentence}
          isPro={isPro}
          resolvedShadowRate={resolvedShadowRate}
          setResolvedShadowRate={setResolvedShadowRate}
          handleShuffle={handleShuffle}
          isShuffling={isShuffling}
          handleShadowPlay={handleShadowPlay}
          isShadowSpeaking={isShadowSpeaking}
          handleRecordToggle={handleRecordToggle}
          isRecording={isRecording}
          recordedUrl={recordedUrl}
        />
      </motion.div>

      {/* Quick Add Popover */}
      {selectionRect && selectedText && (
        <div
          className="fixed z-50 transform -translate-x-1/2 bg-braun-text text-white text-xs px-3 py-1.5 rounded-full shadow-lg cursor-pointer flex items-center gap-1 hover:scale-105 transition-transform"
          style={{ top: selectionRect.top, left: selectionRect.left }}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent clearing selection
            handleQuickAdd();
          }}
        >
          {isAddingCard ? (
            <span>Adding...</span>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              <span>Add "{selectedText}"</span>
            </>
          )}
        </div>
      )}
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
