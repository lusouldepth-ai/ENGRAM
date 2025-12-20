"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { saveCards, type CardData } from "@/app/actions/save-cards";
import { useRouter } from "next/navigation";
import { WheelPicker } from "./WheelPicker";

interface HeroCardGeneratorProps {
    candidates: CardData[];
    step: 'generating' | 'review' | 'saved';
    onStepChange: (step: 'idle' | 'generating' | 'review' | 'saved') => void;
}

/**
 * Dynamically loaded component for card generation results.
 * This component contains framer-motion animations and WheelPicker.
 * By separating it from Hero.tsx, we defer loading of ~3MB of JavaScript
 * until the user actually triggers card generation.
 */
export function HeroCardGenerator({ candidates, step, onStepChange }: HeroCardGeneratorProps) {
    const router = useRouter();
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() =>
        new Set(candidates.map((_, i) => i))
    );
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [isSaving, startSaving] = useTransition();

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const handleSave = () => {
        startSaving(async () => {
            const selectedCards = candidates.filter((_, i) => selectedIndices.has(i));
            const deckTitle = "我的生词本";
            const result = await saveCards(selectedCards, deckTitle);

            if (result.success) {
                onStepChange('saved');
                if (result.deckId) {
                    router.push(`/learning-center/deck/${result.deckId}`);
                }
            } else {
                const confirmLogin = confirm("Please log in to save cards. Go to login?");
                if (confirmLogin) router.push('/login');
            }
        });
    };

    return (
        <div className="h-[600px] bg-gray-50/50 overflow-hidden relative">
            <AnimatePresence mode="wait">
                {/* Loading State */}
                {step === 'generating' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-8 space-y-4 h-full overflow-y-auto"
                    >
                        <Skeleton className="h-16 w-full rounded-xl opacity-80" />
                        <Skeleton className="h-16 w-full rounded-xl opacity-60" />
                        <Skeleton className="h-16 w-full rounded-xl opacity-40" />
                    </motion.div>
                )}

                {/* Review List - 2 Column Layout */}
                {step === 'review' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid md:grid-cols-2 h-full"
                    >
                        {/* Left Column: Scrollable List (iPhone Style) */}
                        <div className="border-r border-gray-200 bg-[#F9F9F7] flex flex-col h-full">
                            {/* Control Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#F9F9F7]/80 backdrop-blur-md z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div 
                                        onClick={() => {
                                            if (selectedIndices.size === candidates.length) {
                                                setSelectedIndices(new Set());
                                            } else {
                                                setSelectedIndices(new Set(candidates.map((_, i) => i)));
                                            }
                                        }}
                                        className={cn(
                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-200",
                                            selectedIndices.size === candidates.length && candidates.length > 0
                                                ? "bg-braun-accent border-braun-accent text-white"
                                                : "bg-white border-gray-300"
                                        )}
                                    >
                                        {selectedIndices.size === candidates.length && candidates.length > 0 && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        SELECTED {selectedIndices.size}/{candidates.length}
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving || selectedIndices.size === 0}
                                    className="h-9 px-5 bg-braun-accent hover:bg-orange-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-orange-100 active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "GENERATE DECK"}
                                </Button>
                            </div>

                            {/* Wheel Picker Container */}
                            <div className="flex-1 relative overflow-hidden">
                                <WheelPicker
                                    items={candidates}
                                    selectedIndex={focusedIndex}
                                    onIndexChange={setFocusedIndex}
                                    onToggleSelection={toggleSelection}
                                    selectedIndices={selectedIndices}
                                />
                            </div>
                        </div>

                        {/* Right Column: Preview Detail */}
                        <div className="bg-[#F4F4F0] p-8 md:p-10 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden h-full">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest absolute top-6 left-6">Preview</div>

                            {focusedIndex !== null && candidates[focusedIndex] ? (
                                <motion.div
                                    key={focusedIndex}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full max-w-sm md:max-w-md aspect-[3/4] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col items-center justify-center text-center p-8 md:p-10 relative"
                                >
                                    {candidates[focusedIndex].phonetic && (
                                        <div className="mb-3 text-gray-400 text-base md:text-lg font-mono tracking-wide">
                                            /{candidates[focusedIndex].phonetic}/
                                        </div>
                                    )}

                                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-braun-text mb-8 tracking-tighter break-words max-w-full leading-none">
                                        {candidates[focusedIndex].front}
                                    </h3>

                                    <div className="space-y-6 max-w-full">
                                        <div className="inline-block px-4 py-1.5 bg-braun-accent/5 rounded-full">
                                            <p className="text-braun-accent font-bold text-lg md:text-xl tracking-tight">
                                                {candidates[focusedIndex].translation}
                                            </p>
                                        </div>

                                        {candidates[focusedIndex].definition && (
                                            <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-[280px] mx-auto line-clamp-4 font-medium">
                                                {candidates[focusedIndex].definition}
                                            </p>
                                        )}
                                    </div>

                                    {/* Selection Indicator on Card - Braun Style */}
                                    <div className="absolute top-6 right-6 md:top-8 md:right-8">
                                        <div 
                                            onClick={() => toggleSelection(focusedIndex)}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-sm",
                                                selectedIndices.has(focusedIndex)
                                                    ? "bg-braun-accent border-braun-accent text-white rotate-0"
                                                    : "bg-white border-gray-100 text-transparent -rotate-12 hover:rotate-0 hover:border-gray-200"
                                            )}
                                        >
                                            <Check className="w-5 h-5" strokeWidth={4} />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center gap-3">
                                    <Sparkles className="w-12 h-12 opacity-20" />
                                    <span className="text-lg">Select a card to preview</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Saved State */}
                {step === 'saved' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 flex flex-col items-center justify-center h-full"
                    >
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-braun-text">Saved to Deck</h3>
                        <p className="text-gray-500 mt-2">Redirecting to learning session...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
