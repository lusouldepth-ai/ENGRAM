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
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#F9F9F7] z-10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedIndices.size === candidates.length && candidates.length > 0}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedIndices(new Set(candidates.map((_, i) => i)));
                                            } else {
                                                setSelectedIndices(new Set());
                                            }
                                        }}
                                        className="data-[state=checked]:bg-braun-accent data-[state=checked]:border-braun-accent"
                                    />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Total {candidates.length}
                                    </span>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving || selectedIndices.size === 0}
                                    className="h-8 text-xs bg-braun-accent hover:bg-orange-700 text-white rounded-full px-4 transition-all shadow-sm"
                                >
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : (
                                        <>Save <span className="ml-1 opacity-80">{selectedIndices.size}</span></>
                                    )}
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
                        <div className="bg-[#F4F4F0] p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden h-full">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 absolute top-6 left-6">Preview</div>

                            {focusedIndex !== null && candidates[focusedIndex] ? (
                                <motion.div
                                    key={focusedIndex}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full max-w-[280px] h-[320px] bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center justify-center text-center p-6 relative"
                                >
                                    {candidates[focusedIndex].phonetic && (
                                        <div className="mb-2 text-gray-400 text-xs md:text-sm font-mono tracking-wide">
                                            /{candidates[focusedIndex].phonetic}/
                                        </div>
                                    )}

                                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-braun-text mb-4 md:mb-6 tracking-tight break-words max-w-full">
                                        {candidates[focusedIndex].front}
                                    </h3>

                                    <div className="space-y-3 md:space-y-4 max-w-full">
                                        <p className="text-gray-500 font-medium text-base md:text-lg">
                                            {candidates[focusedIndex].translation}
                                        </p>

                                        {candidates[focusedIndex].definition && (
                                            <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-[180px] md:max-w-[200px] mx-auto line-clamp-3">
                                                {candidates[focusedIndex].definition}
                                            </p>
                                        )}
                                    </div>

                                    {/* Selection Indicator on Card */}
                                    <div className="absolute top-3 right-3 md:top-4 md:right-4">
                                        <Checkbox
                                            checked={selectedIndices.has(focusedIndex)}
                                            onCheckedChange={() => toggleSelection(focusedIndex)}
                                            className="data-[state=checked]:bg-braun-accent data-[state=checked]:border-braun-accent w-5 h-5 md:w-6 md:h-6 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center gap-2">
                                    <Sparkles className="w-8 h-8 opacity-20" />
                                    <span>Select a card to preview</span>
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
