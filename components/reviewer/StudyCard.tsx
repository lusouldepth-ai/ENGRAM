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
  const [shadowTranslation, setShadowTranslation] = useState(card.shadow_sentence_translation || '');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  // 更宽松地识别口音，兼容 "UK" / "British (UK)" / "british"
  const normalizedAccentPref = (accentPreference || '').toLowerCase();
  const accent: 'us' | 'uk' = normalizedAccentPref.includes('uk') || normalizedAccentPref.includes('british') ? 'uk' : 'us';
  const isPro = (userTier || '').trim().toLowerCase() === 'pro';

  const [isShuffling, startShuffle] = useTransition();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isShadowSpeaking, setIsShadowSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  const router = useRouter();
  const rawTarget = (card.front || '').trim();
  const isAllCaps = rawTarget && rawTarget === rawTarget.toUpperCase();
  const displayTarget = isAllCaps ? rawTarget : rawTarget.toLowerCase();

  // Debug: Log userTier and accentPreference
  console.log('🎴 [StudyCard] userTier:', userTier, '| isPro:', isPro);
  console.log('🎴 [StudyCard] accentPreference:', accentPreference, '| accent:', accent);

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
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      recordedAudioRef.current.currentTime = 0;
      recordedAudioRef.current = null;
    }

    // Stop global TTS if playing
    if (typeof window !== 'undefined') {
      // We might want to expose a stop method from ttsService if needed
      // For now, browser synthesis cancel is handled inside playHighQualitySpeech
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsShadowSpeaking(false);
  };

  const handlePlay = () => {
    stopAudio();
    speakViaWebAPI(rawTarget);
  };

  const handleExamplePlay = (text: string) => {
    stopAudio();
    if (!text) return;
    speakViaWebAPI(text);
  };

  const speakViaWebAPI = async (text: string, speed: number = 1.0, setState: (val: boolean) => void = setIsSpeaking) => {
    if (typeof window === 'undefined') {
      console.warn('Not in browser environment');
      return;
    }

    // Ensure all previous audio is stopped
    stopAudio();

    // Wait a tiny bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 50));

    setState(true);

    try {
      // Dynamically import to avoid SSR issues, although ttsService is now safe
      const { playHighQualitySpeech } = await import('@/lib/services/ttsService');
      const accentType = accent === 'uk' ? 'UK' : 'US';
      await playHighQualitySpeech(text, accentType, speed);
    } catch (error) {
      console.error('TTS playback error:', error);
    } finally {
      setState(false);
    }
  };

  const handleShadowPlay = () => {
    if (!shadowSentence) return;
    if (!isPro) {
      router.push('/pricing');
      return;
    }

    stopAudio();
    speakViaWebAPI(shadowSentence, playbackSpeed, setIsShadowSpeaking);
  };

  const handleRecordToggle = async () => {
    console.log('🎤 [Recording] handleRecordToggle called');
    console.log('🎤 [Recording] isPro:', isPro, '| userTier:', userTier);

    if (!isPro) {
      console.log('🎤 [Recording] User is not Pro, redirecting to pricing');
      router.push('/pricing');
      return;
    }

    if (isRecording) {
      console.log('🎤 [Recording] Stopping recording...');
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      console.log('🎤 [Recording] Starting recording...');
      try {
        console.log('🎤 [Recording] Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 [Recording] Microphone permission granted!');

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          console.log('🎤 [Recording] Data available, size:', e.data.size);
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log('🎤 [Recording] Recording stopped, creating blob...');
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          console.log('🎤 [Recording] Recording saved:', url);
          setRecordedUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        console.log('🎤 [Recording] Recording started!');
        setIsRecording(true);
      } catch (error) {
        console.error('🎤 [Recording] Error accessing microphone:', error);
        alert('无法访问麦克风，请检查浏览器权限设置');
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
        if (result.translation) {
          setShadowTranslation(result.translation);
        }
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

    // 无论对错都翻转，错误时通过 DiffResult 高亮差异
    setTimeout(() => onFlip(true), 200);
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

  const handlePlayRecording = () => {
    if (!recordedUrl) return;
    stopAudio();
    const audio = new Audio(recordedUrl);
    recordedAudioRef.current = audio;
    audio.play();
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
            handleWordPlay={handlePlay}
            shadowSentence={shadowSentence}
            isPro={isPro}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            handleShadowPlay={handleShadowPlay}
            isShadowSpeaking={isShadowSpeaking}
            handleRecordToggle={handleRecordToggle}
            isRecording={isRecording}
            handlePlayRecording={handlePlayRecording}
            recordedUrl={recordedUrl}
            handleShuffle={handleShuffle}
            isShuffling={isShuffling}
            onRate={handleRating}
            shadowTranslation={shadowTranslation}
          />
        </motion.div>
      </div>
    </div>
  );
}
