'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Database } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { regenerateShadowSentence } from '@/app/actions/shadow-actions';
import { getIntervalPreview } from '@/app/actions/review-actions';
import { checkCardTranslation, fixCardTranslation } from '@/app/actions/fix-translation-action';
import { playHighQualitySpeech } from '@/lib/services/ttsService';
import { StudyCardFront } from './StudyCardFront';
import dynamic from 'next/dynamic';

const StudyCardBack = dynamic(() => import('./StudyCardBack').then(mod => mod.StudyCardBack), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-white rounded-3xl animate-pulse" />
});

type Card = Database['public']['Tables']['cards']['Row'] & {
  audio_url?: string | null;
};

type IntervalPreviews = {
  forgot: { display: string };
  hard: { display: string };
  good: { display: string };
  easy: { display: string };
} | null;

interface StudyCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: (flipped: boolean) => void;
  onResultChange?: (result: { correct: boolean; input: string }) => void;
  onRate?: (grade: 'forgot' | 'hard' | 'good' | 'easy') => void;
  userTier?: string | null;
  accentPreference?: string | null;
  shadowRate?: number | null;
  // Progress tracking
  totalCards?: number;
  completedCards?: number;
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
  totalCards = 0,
  completedCards = 0,
}: StudyCardProps) {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shadowSentence, setShadowSentence] = useState(card.shadow_sentence || '');
  const [shadowTranslation, setShadowTranslation] = useState(card.shadow_sentence_translation || '');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [intervalPreviews, setIntervalPreviews] = useState<IntervalPreviews>(null);
  const [fixedTranslation, setFixedTranslation] = useState<string | null>(null);
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


  // Reset state on card change and fetch interval previews
  useEffect(() => {
    setUserInput('');
    setIsCorrect(null);
    setShadowSentence(card.shadow_sentence || '');
    setShadowTranslation(card.shadow_sentence_translation || '');
    setPlaybackSpeed(1.0);
    setIntervalPreviews(null);
    setFixedTranslation(null);
    stopAudio();

    // 获取 FSRS 预览数据
    async function fetchPreviews() {
      const previews = await getIntervalPreview(card.id);
      if (previews) {
        setIntervalPreviews(previews);
      }
    }
    fetchPreviews();

    // 检测并修复翻译语言
    async function checkAndFixTranslation() {
      try {
        const checkResult = await checkCardTranslation(card.id);
        if (checkResult.needsFix) {
          const fixResult = await fixCardTranslation(card.id);
          if (fixResult.success && fixResult.newTranslation) {
            setFixedTranslation(fixResult.newTranslation);
          }
        }
      } catch {
        // Silent fail for translation fix
      }
    }
    checkAndFixTranslation();
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
    if (typeof window === 'undefined') return;

    // Ensure all previous audio is stopped
    stopAudio();

    // Wait a tiny bit to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 50));

    setState(true);

    try {
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
          setRecordedUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
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

  // Calculate progress percentage
  const progressPercent = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[600px]">
      {/* Progress Bar */}
      <div className="w-full mb-6">

        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card Container - Pure CSS 3D Flip */}
      <div className="w-full max-w-md aspect-square [perspective:1000px] relative">
        <div
          className="w-full h-full relative transition-transform duration-[400ms] ease-out [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
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
            isFlipped={isFlipped}
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
            intervalPreviews={intervalPreviews}
            fixedTranslation={fixedTranslation}
          />
        </div>
      </div>
    </div>
  );
}
