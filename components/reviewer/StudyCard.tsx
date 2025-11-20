'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Database } from '@/lib/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, RefreshCw, Mic, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Card = Database['public']['Tables']['cards']['Row'];

interface StudyCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: (flipped: boolean) => void;
}

export function StudyCard({ card, isFlipped, onFlip }: StudyCardProps) {
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Phase 1: Auto-play (Mock)
  useEffect(() => {
    if (!isFlipped) {
      // TODO: Play audio logic here
      // const audio = new Audio(card.phonetic_audio_url);
      // audio.play();
      inputRef.current?.focus();
    }
  }, [card, isFlipped]);

  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isFlipped) {
      const cleanInput = userInput.trim().toLowerCase();
      const cleanTarget = card.front.trim().toLowerCase();
      setIsCorrect(cleanInput === cleanTarget);
      onFlip(true);
    }
  };

  return (
    <div className="relative w-full max-w-md h-[400px] perspective-1000">
      <motion.div
        className="w-full h-full relative preserve-3d transition-all duration-500"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* FRONT: Dictation Mode */}
        <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8">
          <div className="mb-8">
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-gray-50 hover:bg-gray-100">
              <Volume2 className="w-6 h-6 text-gray-600" />
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
          className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col p-8 rotate-y-180 overflow-y-auto no-scrollbar"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {/* Result Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-braun-text mb-1">
              <DiffResult input={userInput} target={card.front} />
            </h2>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">{card.phonetic || "/.../"}</span>
              <span className="italic">{card.pos || "n."}</span>
            </div>
            {!isCorrect && (
               <p className="text-sm text-orange-600 mt-2 font-medium">Correct: {card.front}</p>
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

            {/* Shadow Sentence (Pro Feature) */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shadowing</h4>
                 {/* Assuming we passed user.is_pro via props or context. For now mocking logic: */}
                 {/* Replace with actual check later */}
                 {/* <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">PRO</span> */}
               </div>
               
               <div className="relative group cursor-pointer" onClick={() => router.push('/pricing')}>
                  {/* Blurred Content */}
                  <p className={cn("text-lg font-serif leading-relaxed transition-all", true ? "blur-sm select-none opacity-50" : "")}>
                    {card.shadow_sentence || "This is a long, rhythmic sentence designed for shadowing practice."}
                  </p>
                  
                  {/* Lock Overlay */}
                  {true && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border flex items-center gap-2">
                            <Lock className="w-3 h-3 text-braun-accent" />
                            <span className="text-xs font-medium text-braun-text">Unlock Pro</span>
                        </div>
                    </div>
                  )}
               </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Simple Diff Component
function DiffResult({ input, target }: { input: string, target: string }) {
    // Very basic diff for visual effect
    // If correct, return normal text
    // If incorrect, highlight errors (simplified: just show target with error color if mismatch)
    
    if (input.trim().toLowerCase() === target.trim().toLowerCase()) {
        return <span className="text-green-600">{target}</span>;
    }

    // For MVP: Just return the target in red/orange if wrong
    return <span className="text-braun-accent line-through decoration-2 decoration-braun-accent/30">{input || "..."}</span>;
}

