'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/supabase/types";

type Card = Database['public']['Tables']['cards']['Row'];

interface FlashcardProps {
  card: Card;
  onFlip?: (isFlipped: boolean) => void;
  isFlipped: boolean;
}

export function Flashcard({ card, onFlip, isFlipped }: FlashcardProps) {
  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Default to English
      utterance.rate = 0.9;
      window.speechSynthesis.cancel(); // Cancel previous
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFlip = () => {
    const newState = !isFlipped;
    onFlip?.(newState);
    if (newState) {
      playAudio(card.front);
    }
  };

  return (
    <div 
      className="relative w-full max-w-md aspect-[4/5] cursor-pointer perspective-1000"
      onClick={handleFlip}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div className={cn(
          "absolute inset-0 backface-hidden bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center hover:shadow-md transition-shadow",
        )}>
          <h2 className="text-4xl font-bold text-braun-text tracking-tight">{card.front}</h2>
          {card.phonetic && (
             <p className="mt-4 text-lg text-gray-400 font-mono">{card.phonetic}</p>
          )}
          <div className="absolute bottom-8 text-xs text-gray-300 uppercase tracking-widest">Tap to flip</div>
        </div>

        {/* Back */}
        <div className={cn(
          "absolute inset-0 backface-hidden bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-8 text-left rotate-y-180",
        )}
        style={{ transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between mb-6">
             <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-500 uppercase">{card.pos || 'word'}</span>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 playAudio(card.front);
               }}
               className="p-2 rounded-full hover:bg-gray-100 text-braun-accent transition-colors"
             >
               <Volume2 className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto">
            
            {/* Translation */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Meaning</h3>
              <p className="text-2xl font-medium text-braun-text">{card.translation}</p>
            </div>

            {/* Definition */}
            {card.definition && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Definition</h3>
                <p className="text-gray-700 leading-relaxed">{card.definition}</p>
              </div>
            )}

            {/* Example */}
            {card.example && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Example</h3>
                <p className="text-gray-600 italic">"{card.example}"</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

