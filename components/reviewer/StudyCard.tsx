'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Database } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { regenerateShadowSentence } from '@/app/actions/shadow-actions';
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
  onRate?: (grade: 'forgot' | 'hard' | 'good' | 'easy') => void;
  userTier?: string | null;
  accentPreference?: string | null;
  shadowRate?: number | null;
}

export function StudyCard({
  card,
  isFlipped,
  onFlip,
  onResultChange,
  onRate,
  userTier,
  accentPreference,
  shadowRate: shadowRateProp,
}: StudyCardProps) {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shadowSentence, setShadowSentence] = useState(card.shadow_sentence || '');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const accent: 'us' | 'uk' = accentPreference?.toLowerCase() === 'uk' ? 'uk' : 'us';
  const isPro = (userTier || '').trim().toLowerCase() === 'pro';

  const [isShuffling, startShuffle] = useTransition();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShadowSpeaking, setIsShadowSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const router = useRouter();
  const rawTarget = (card.front || '').trim();
  const isAllCaps = rawTarget && rawTarget === rawTarget.toUpperCase();
  const displayTarget = isAllCaps ? rawTarget : rawTarget.toLowerCase();

  // Auto-play on card load
  useEffect(() => {
    if (!isFlipped) {
      handlePlay();
    }
    return () => stopAudio();
  }, [card.id, isFlipped]);

  // Reset state on card change
  useEffect(() => {
    setUserInput('');
    setIsCorrect(null);
    setShadowSentence(card.shadow_sentence || '');
    setPlaybackSpeed(1.0);
    stopAudio();
  }, [card]);

  const stopAudio = () => {
    // Stop HTML Audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Cancel all Speech Synthesis utterances
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (utteranceRef.current) {
      utteranceRef.current = null;
    }

    setIsSpeaking(false);
    setIsShadowSpeaking(false);
  };

  const handlePlay = () => {
    stopAudio();
    speakViaWebAPI(rawTarget);
  };

  const handleWordPlay = () => {
    stopAudio();
    speakViaWebAPI(rawTarget);
  };

  const handleExamplePlay = (text: string) => {
    stopAudio();
    if (!text) return;
    speakViaWebAPI(text);
  };

  const speakViaWebAPI = async (text: string) => {
    if (typeof window === 'undefined') {
      console.warn('Not in browser environment');
      return;
    }

    // Ensure all previous audio is stopped
    stopAudio();

    // Wait a tiny bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 50));

    setIsSpeaking(true);

    try {
      const { playHighQualitySpeech } = await import('@/lib/services/ttsService');
      const accentType = accent === 'uk' ? 'UK' : 'US';
      await playHighQualitySpeech(text, accentType, 0.75);
    } catch (error) {
      console.error('TTS playback error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleShadowPlay = () => {
    if (!shadowSentence) return;
    if (!isPro) {
      router.push('/pricing');
      return;
    }

    stopAudio();

    const utterance = new SpeechSynthesisUtterance(shadowSentence);
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    utterance.rate = playbackSpeed;

    utterance.onstart = () => setIsShadowSpeaking(true);
    utterance.onend = () => setIsShadowSpeaking(false);
    utterance.onerror = () => setIsShadowSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleRecordToggle = async () => {
    if (!isPro) {
      router.push('/pricing');
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          console.log('Recording saved:', url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
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
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheck();
  };

  const handleCheck = () => {
    const correct = userInput.trim().toLowerCase() === displayTarget.trim();
    setIsCorrect(correct);

    if (onResultChange) {
      onResultChange({ correct, input: userInput });
    }

    if (correct) {
      setTimeout(() => onFlip(true), 500);
    }
  };

  const handleReveal = () => {
    setIsCorrect(null);
    onFlip(true);
  };

  const handleRating = (grade: 'forgot' | 'hard' | 'good' | 'easy') => {
    if (onRate) {
      onRate(grade);
    }
  };

  const handleSelection = () => {
    // Quick add functionality placeholder
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[600px]">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-neutral-200 rounded-full mb-6">
        <div
          className="h-1 bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: '0%' }}
        />
      </div>

      {/* Card Container */}
      <div className="w-full max-w-2xl aspect-[4/3] perspective-1000 relative">
        <motion.div
          className="w-full h-full relative"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <StudyCardFront
            userInput={userInput}
            setUserInput={setUserInput}
            handleSubmit={handleSubmit}
            handlePlayAudio={handlePlay}
            handleCheck={handleCheck}
            handleReveal={handleReveal}
            isSpeaking={isSpeaking}
            isCorrect={isCorrect}
          />

          {/* Back */}
          <StudyCardBack
            card={card}
            userInput={userInput}
            displayTarget={displayTarget}
            rawTarget={rawTarget}
            isCorrect={isCorrect}
            handleSelection={handleSelection}
            handleExamplePlay={handleExamplePlay}
            handleWordPlay={handleWordPlay}
            shadowSentence={shadowSentence}
            isPro={isPro}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            handleShadowPlay={handleShadowPlay}
            isShadowSpeaking={isShadowSpeaking}
            handleRecordToggle={handleRecordToggle}
            isRecording={isRecording}
            handleShuffle={handleShuffle}
            isShuffling={isShuffling}
            onRate={handleRating}
          />
        </motion.div>
      </div>
    </div>
  );
}
