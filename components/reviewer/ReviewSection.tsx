'use client';

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StudyCard } from "@/components/reviewer/StudyCard";
import { Button } from "@/components/ui/button";
import { getDueCards, reviewCard } from "@/app/actions/review-actions";
import { Database } from "@/lib/supabase/types";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type Card = Database['public']['Tables']['cards']['Row'];

export default function ReviewSection() {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    const loadCards = async () => {
      const dueCards = await getDueCards();
      setCards(dueCards);
      setIsLoading(false);
    };
    loadCards();
  }, []);

  const currentCard = cards[currentIndex];

  const handleReview = (grade: 'forgot' | 'hard' | 'good') => {
    if (!currentCard || isSubmitting) return;

    startTransition(async () => {
      // Optimistic UI
      const result = await reviewCard(currentCard.id, grade);
      
      if (result.success) {
         setIsFlipped(false);
         // Remove current card from local state to advance
         setCards(prev => prev.filter(c => c.id !== currentCard.id));
         setCurrentIndex(0);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-braun-accent" />
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="w-full max-w-md flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-600">
           <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-braun-text mb-2">All Caught Up!</h2>
        <p className="text-gray-500 mb-6">You've reviewed all your due cards. Add more context above to keep learning.</p>
        
        <div className="text-xs text-gray-400 flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
           <span className="w-2 h-2 rounded-full bg-braun-accent"></span>
           Waiting for SRS Schedule
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-6 px-2">
         <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Review Session</span>
         <span className="text-sm font-mono text-gray-400 bg-white px-2 py-1 rounded border">
           {cards.length} remaining
         </span>
      </div>

      <div className="w-full max-w-md flex flex-col items-center justify-center mb-8">
        <StudyCard 
           card={currentCard} 
           isFlipped={isFlipped} 
           onFlip={setIsFlipped}
        />
      </div>

      <div className="h-24 w-full max-w-md flex items-end justify-center">
        <AnimatePresence mode="wait">
          {isFlipped ? (
            <motion.div 
              key="buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 w-full"
            >
              <Button 
                className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200 h-12 rounded-xl font-medium transition-colors"
                onClick={() => handleReview('forgot')}
                disabled={isSubmitting}
              >
                Forgot
                <span className="block text-[10px] opacity-60 font-normal ml-2">1m</span>
              </Button>
              
              <Button 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 h-12 rounded-xl font-medium transition-colors"
                onClick={() => handleReview('hard')}
                disabled={isSubmitting}
              >
                Hard
                <span className="block text-[10px] opacity-60 font-normal ml-2">2d</span>
              </Button>
              
              <Button 
                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 border-green-200 h-12 rounded-xl font-medium transition-colors"
                onClick={() => handleReview('good')}
                disabled={isSubmitting}
              >
                Good
                <span className="block text-[10px] opacity-60 font-normal ml-2">4d</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 text-sm flex items-center gap-2"
            >
               {/* <span>Type answer to flip</span> */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Keyboard shortcuts */}
      <KeyboardListener 
         onOne={() => isFlipped && handleReview('forgot')}
         onTwo={() => isFlipped && handleReview('hard')}
         onThree={() => isFlipped && handleReview('good')}
      />
    </div>
  );
}

function KeyboardListener({ onOne, onTwo, onThree }: any) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') onOne();
      if (e.key === '2') onTwo();
      if (e.key === '3') onThree();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOne, onTwo, onThree]);
  return null;
}

