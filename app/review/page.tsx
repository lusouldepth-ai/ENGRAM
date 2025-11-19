'use client';

import { useState, useEffect, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flashcard } from "@/components/reviewer/Flashcard";
import { Button } from "@/components/ui/button";
import { getDueCards, reviewCard } from "@/app/actions/review-actions";
import { Database } from "@/lib/supabase/types";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type Card = Database['public']['Tables']['cards']['Row'];

export default function ReviewPage() {
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
      // Optimistic UI: Move to next card immediately in state? 
      // For safety, we wait for server action but can show loading or just disable buttons.
      // Let's do optimistic update for better UX.
      
      const result = await reviewCard(currentCard.id, grade);
      
      if (result.success) {
         setIsFlipped(false);
         // Move to next card
         if (currentIndex < cards.length) {
             setCurrentIndex(prev => prev + 1);
         }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-braun-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-braun-accent" />
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-braun-bg flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
           <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-braun-text mb-2">All Caught Up!</h1>
        <p className="text-gray-500 max-w-md">You've reviewed all your due cards for now. Great job!</p>
        <Button className="mt-8 bg-braun-text text-white rounded-full" onClick={() => window.location.href = '/'}>
          Back Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-braun-bg flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
         <Logo className="w-8 h-8" />
         <span className="text-sm font-mono text-gray-400">
           {currentIndex + 1} / {cards.length}
         </span>
      </div>

      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center">
        <Flashcard 
           card={currentCard} 
           isFlipped={isFlipped} 
           onFlip={setIsFlipped}
        />
      </div>

      <div className="h-32 w-full max-w-md flex items-end justify-center pb-8">
        <AnimatePresence>
          {isFlipped && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex gap-3 w-full"
            >
              <Button 
                className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200 h-14 rounded-xl text-lg font-medium"
                onClick={() => handleReview('forgot')}
                disabled={isSubmitting}
              >
                Forgot
                <span className="block text-[10px] opacity-60 font-normal ml-2">1m</span>
              </Button>
              
              <Button 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 h-14 rounded-xl text-lg font-medium"
                onClick={() => handleReview('hard')}
                disabled={isSubmitting}
              >
                Hard
                <span className="block text-[10px] opacity-60 font-normal ml-2">2d</span>
              </Button>
              
              <Button 
                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 border-green-200 h-14 rounded-xl text-lg font-medium"
                onClick={() => handleReview('good')}
                disabled={isSubmitting}
              >
                Good
                <span className="block text-[10px] opacity-60 font-normal ml-2">4d</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isFlipped && (
           <div className="text-gray-400 text-sm animate-pulse">
              Press space to flip
           </div>
        )}
      </div>

      {/* Keyboard shortcuts */}
      <KeyboardListener 
         onSpace={() => !isFlipped && setIsFlipped(true)}
         onOne={() => isFlipped && handleReview('forgot')}
         onTwo={() => isFlipped && handleReview('hard')}
         onThree={() => isFlipped && handleReview('good')}
      />
    </div>
  );
}

function KeyboardListener({ onSpace, onOne, onTwo, onThree }: any) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scroll
        onSpace();
      }
      if (e.key === '1') onOne();
      if (e.key === '2') onTwo();
      if (e.key === '3') onThree();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSpace, onOne, onTwo, onThree]);
  return null;
}

