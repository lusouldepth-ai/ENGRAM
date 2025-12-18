'use client';

import { useState, useEffect, useTransition } from "react";
import { StudyCard } from "@/components/reviewer/StudyCard";
import { StudyCardSkeleton } from "@/components/reviewer/StudyCardSkeleton";
import { getDueCards, reviewCard, getTodayReviewedCount } from "@/app/actions/review-actions";
import { Database } from "@/lib/supabase/types";

type Card = Database["public"]["Tables"]["cards"]["Row"];
type ProfileMeta = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "tier" | "accent_preference"
>;

interface ReviewSectionProps {
  profile?: ProfileMeta;
  // Pre-fetched data for server-side rendering (eliminates client-side fetch delay)
  initialCards?: Card[];
  initialTodayCount?: number;
}

export default function ReviewSection({ profile, initialCards, initialTodayCount }: ReviewSectionProps) {
  // If server provided initial data, use it immediately (no loading state)
  const hasInitialData = initialCards !== undefined && initialTodayCount !== undefined;
  const [cards, setCards] = useState<Card[]>(hasInitialData ? initialCards : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(!hasInitialData); // Skip loading if data is pre-fetched
  const [isSubmitting, startTransition] = useTransition();
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [initialCardCount, setInitialCardCount] = useState(hasInitialData ? initialCards.length : 0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [todayReviewedCount, setTodayReviewedCount] = useState(hasInitialData ? initialTodayCount : 0);

  // Debug: Log received profile
  console.log('📋 [ReviewSection] Received profile:', profile);
  console.log('📋 [ReviewSection] tier:', profile?.tier, '| accent_preference:', profile?.accent_preference);
  console.log('📋 [ReviewSection] Has initial data:', hasInitialData, '| initialCards count:', initialCards?.length);

  // Only fetch on client if no initial data was provided (fallback for /review route)
  useEffect(() => {
    if (hasInitialData) return; // Skip if data is already pre-fetched

    const loadCards = async () => {
      const dueCards = await getDueCards();
      const reviewedToday = await getTodayReviewedCount();
      setCards(dueCards);
      setInitialCardCount(dueCards.length);
      setTodayReviewedCount(reviewedToday);
      setIsLoading(false);
    };
    loadCards();
  }, [hasInitialData]);

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
        setSessionCompletedCount(prev => prev + 1);
        setTodayReviewedCount(prev => prev + 1);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (!currentCard || isSubmitting) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        }
      } else if (isFlipped) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleReview('forgot');
            break;
          case '2':
            e.preventDefault();
            handleReview('hard');
            break;
          case '3':
            e.preventDefault();
            handleReview('good');
            break;
          case '4':
            e.preventDefault();
            handleReview('easy');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, isFlipped, isSubmitting, handleReview]);

  // ... existing code

  if (isLoading) {
    return <StudyCardSkeleton />;
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
        totalCards={initialCardCount + todayReviewedCount}
        completedCards={todayReviewedCount}
      />
    </div>
  );
}
