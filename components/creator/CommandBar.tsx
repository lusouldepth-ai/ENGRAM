'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Command, Check } from 'lucide-react';
import { generateCards } from '@/app/actions/generate-cards';
import { saveCards, type CardData } from '@/app/actions/save-cards';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function CommandBar() {
  const [input, setInput] = useState('');
  const [candidates, setCandidates] = useState<CardData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [step, setStep] = useState<'idle' | 'generating' | 'review' | 'saved'>('idle');

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleGenerate = () => {
    if (!input.trim()) return;
    setStep('generating');
    startGenerating(async () => {
      try {
        const result = await generateCards(input);
        if (result.success && Array.isArray(result.data)) {
          setCandidates(result.data);
          setSelectedIndices(new Set(result.data.map((_, i) => i)));
          setStep('review');
        } else {
          setStep('idle');
          if (result.error === "QUOTA_EXCEEDED") {
            router.push('/pricing');
            return;
          }
          alert("Failed to generate cards: " + (result.error || "Unknown error"));
        }
      } catch (e) {
        console.error("Critical error in handleGenerate:", e);
        setStep('idle');
        alert("An unexpected error occurred.");
      }
    });
  };

  const handleSave = () => {
    startSaving(async () => {
      const selectedCards = candidates.filter((_, i) => selectedIndices.has(i));
      const deckTitle = "我的生词本";
      const result = await saveCards(selectedCards, deckTitle);

      if (result.success) {
        setStep('saved');
        if (result.deckId) {
          router.push(`/study/${result.deckId}`);
        }
        setStep('idle');
        setInput('');
        setCandidates([]);
      } else {
        alert("Failed to save. Please make sure you are logged in.");
      }
    });
  };

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  // Focus input helper
  const focusInput = () => {
    if (step === 'idle' && inputRef.current) {
      inputRef.current.focus();
    }
  }

  return (
    // Replicating the "New Design" container logic but inside CommandBar component
    <div className="w-full bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">

      {/* Top Bar / Header Area - Minimalist Input */}
      <div
        className="border-b border-gray-200 p-4 md:p-6 flex flex-col gap-2 cursor-text"
        onClick={focusInput}
      >
        <div className="flex items-center gap-3 text-lg md:text-2xl font-medium text-braun-text relative h-10 md:h-12">
          {/* The actual input, clean and full width */}
          <input
            ref={inputRef}
            className="bg-transparent border-none outline-none text-braun-text placeholder-gray-300 w-full h-full p-0 m-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && step === 'idle' && input.trim()) {
                handleGenerate();
              }
            }}
            placeholder="What do you want to learn today?"
            disabled={step !== 'idle'}
            autoFocus
          />
          {/* Loading Indicator */}
          {step === 'generating' && <Loader2 className="w-5 h-5 animate-spin text-braun-accent" />}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gray-50/50">
        <AnimatePresence mode="wait">
          {/* Loading State Skeleton */}
          {step === 'generating' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 space-y-3"
            >
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </motion.div>
          )}

          {/* Review List */}
          {step === 'review' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-medium text-gray-500">Generated {candidates.length} cards</h3>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || selectedIndices.size === 0}
                  className="bg-braun-accent hover:bg-orange-700 text-white rounded-full px-6 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </div>

              <div className="grid gap-3">
                {candidates.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer bg-white",
                      selectedIndices.has(i)
                        ? "border-braun-accent/30 shadow-sm"
                        : "border-gray-100 opacity-60 hover:opacity-100"
                    )}
                    onClick={() => toggleSelection(i)}
                  >
                    <Checkbox
                      checked={selectedIndices.has(i)}
                      onCheckedChange={() => toggleSelection(i)}
                      className="mt-1 data-[state=checked]:bg-braun-accent data-[state=checked]:border-braun-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-braun-text truncate">{card.front}</h4>
                        <span className="text-xs text-gray-400 font-mono">/{card.phonetic}/</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">{card.definition}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Saved State */}
          {step === 'saved' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-8 text-center"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-braun-text font-medium">Saved to Deck</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
