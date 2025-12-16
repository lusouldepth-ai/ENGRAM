'use client';

import { useState, useEffect, useTransition } from "react";
import { StudyCard } from "@/components/reviewer/StudyCard";
import { getDueCards, reviewCard } from "@/app/actions/review-actions";
import { Database } from "@/lib/supabase/types";

type Card = Database["public"]["Tables"]["cards"]["Row"];
type ProfileMeta = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "tier" | "accent_preference"
>;

interface ReviewSectionProps {
  profile?: ProfileMeta;
}

export default function ReviewSection({ profile }: ReviewSectionProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [initialCardCount, setInitialCardCount] = useState(0);

  // Debug: Log received profile
  console.log('📋 [ReviewSection] Received profile:', profile);
  console.log('📋 [ReviewSection] tier:', profile?.tier, '| accent_preference:', profile?.accent_preference);

  useEffect(() => {
    const loadCards = async () => {
      const dueCards = await getDueCards();
      setCards(dueCards);
      setInitialCardCount(dueCards.length);
      setIsLoading(false);
    };
    loadCards();
  }, []);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    setAnswerCorrect(null);
    setIsFlipped(false);
  }, [currentCard?.id]);

  const handleReview = (grade: 'forgot' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || isSubmitting) return;
    if (!isFlipped) return;

    startTransition(async () => {
      // Map 'easy' to 'good' for SRS (both use similar intervals)
      const srsGrade = grade === 'easy' ? 'good' : grade;

      const result = await reviewCard(currentCard.id, srsGrade);

      if (result.success) {
        setIsFlipped(false);
        setAnswerCorrect(null);

        // Move to next card
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // All cards reviewed
          setCards([]);
          setCurrentIndex(0);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-500">Loading cards...</p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">You've reviewed all your due cards for now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <StudyCard
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={setIsFlipped}
        onResultChange={(result) => setAnswerCorrect(result.correct)}
        onRate={handleReview}
        userTier={profile?.tier}
        accentPreference={profile?.accent_preference}
        totalCards={initialCardCount}
        completedCards={currentIndex}
      />
    </div>
  );
}
