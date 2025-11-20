'use client';

import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Database } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, RefreshCw, Mic, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { regenerateShadowSentence } from '@/app/actions/shadow-actions';

type Card = Database['public']['Tables']['cards']['Row'] & {
  audio_url?: string | null;
};

interface StudyCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: (flipped: boolean) => void;
  onResultChange?: (result: { correct: boolean; input: string }) => void;
}

export function StudyCard({ card, isFlipped, onFlip, onResultChange }: StudyCardProps) {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shadowSentence, setShadowSentence] = useState(card.shadow_sentence || '');
  const [isPro, setIsPro] = useState(false);
  const [isLoadingTier, setIsLoadingTier] = useState(true);
  const [isShuffling, startShuffle] = useTransition();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const rawTarget = (card.front || '').trim();
  const isAllCaps = rawTarget && rawTarget === rawTarget.toUpperCase();
  const displayTarget = isAllCaps ? rawTarget : rawTarget.toLowerCase();

  // Phase 1: Auto-play (Mock)
  useEffect(() => {
    if (!isFlipped) {
      inputRef.current?.focus();
      handlePlay();
    }
    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, isFlipped]);

  useEffect(() => {
    setUserInput('');
    setIsCorrect(null);
    setShadowSentence(card.shadow_sentence || '');
    stopAudio();
  }, [card]);

  useEffect(() => {
    let mounted = true;
    async function fetchTier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) {
        setIsPro(false);
        setIsLoadingTier(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      if (mounted) {
        setIsPro((data?.tier || '').toLowerCase() === 'pro');
        setIsLoadingTier(false);
      }
    }
    fetchTier();
    return () => {
      mounted = false;
    };
  }, [supabase]);

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
    setIsSpeaking(false);
  };

  const handlePlay = () => {
    if (isFlipped) return;
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

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(card.front);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
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
                 <div className="flex gap-3">
                   <Button variant="outline" size="sm" className="rounded-full px-4 py-2 text-sm font-medium">
                     <Mic className="w-4 h-4 mr-1" />
                     Record
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

