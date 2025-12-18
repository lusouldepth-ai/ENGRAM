"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Command, Sparkles, Check, Loader2, Plus } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useState, useTransition, useRef } from "react";
import { generateCards } from "@/app/actions/generate-cards";
import { saveCards, type CardData } from "@/app/actions/save-cards";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

export function Hero() {
   const { t } = useLanguage();
   const router = useRouter();

   // -- CommandBar Logic Integration --
   const [input, setInput] = useState('');
   const [candidates, setCandidates] = useState<CardData[]>([]);
   const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
   const [focusedIndex, setFocusedIndex] = useState<number>(0);

   const [isGenerating, startGenerating] = useTransition();
   const [isSaving, startSaving] = useTransition();
   const [step, setStep] = useState<'idle' | 'generating' | 'review' | 'saved'>('idle');
   const inputRef = useRef<HTMLInputElement>(null);

   const handleGenerate = () => {
      if (!input.trim()) return;
      setStep('generating');
      startGenerating(async () => {
         try {
            const result = await generateCards(input);
            if (result.success && Array.isArray(result.data)) {
               setCandidates(result.data);
               setSelectedIndices(new Set(result.data.map((_, i) => i)));
               setFocusedIndex(0);
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
               router.push(`/learning-center/deck/${result.deckId}`);
            }
            // Reset after delay or jump? usually jump.
         } else {
            // Likely not logged in
            const confirmLogin = confirm("Please log in to save cards. Go to login?");
            if (confirmLogin) router.push('/login');
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
   // -- End Logic --

   return (
      <section className="w-full flex flex-col items-center justify-center px-4 py-16 md:py-24 overflow-hidden">
         <div className="text-center max-w-5xl mx-auto animate-fade-up relative z-10">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-braun-dark mb-6">
               {t('hero.title')}
            </h1>

            <p className="text-xl text-braun-gray max-w-2xl mx-auto mb-10 leading-relaxed whitespace-nowrap">
               {t('hero.subtitle')}
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
               <Link href="/dashboard" className="w-full md:w-auto">
                  <Button className="w-full md:w-auto bg-braun-accent text-white px-8 py-6 rounded-full font-medium text-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl">
                     {t('hero.cta')}
                  </Button>
               </Link>

            </div>
         </div>

         {/* Visual Demo */}
         <div className="mt-20 w-full max-w-4xl relative animate-fade-up [animation-delay:300ms]">
            {/* Abstract Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-gray-200/30 to-transparent rounded-[50%] blur-3xl -z-10 pointer-events-none"></div>

            {/* App Container */}
            <div className="bg-braun-surface border border-gray-200 rounded-2xl shadow-xl overflow-hidden relative">




               {/* Header / Container */}
               <div className="border-b border-gray-200 p-6 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm transition-colors relative overflow-hidden">

                  {/* Digital Braun / Dynamic Island Input */}
                  <div className={cn(
                     "relative flex items-center gap-3 px-5 py-3 bg-white text-braun-text rounded-full transition-all duration-500 ease-out shadow-lg border border-gray-100",
                     "w-full max-w-xl hover:shadow-xl hover:-translate-y-0.5 focus-within:shadow-xl focus-within:-translate-y-0.5",
                     step === 'generating' ? "animate-pulse" : ""
                  )}>
                     <Sparkles className={cn("w-5 h-5 transition-colors shrink-0", input ? "text-braun-accent" : "text-gray-400")} />

                     <input
                        ref={inputRef}
                        className="bg-transparent border-none outline-none text-braun-text placeholder:text-gray-400 w-full text-lg font-medium tracking-tight bg-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && step === 'idle' && input.trim()) {
                              handleGenerate();
                           }
                        }}
                        placeholder="What matches the Braun style?"
                        disabled={step !== 'idle'}
                     />

                     <div className="flex items-center gap-2 shrink-0">
                        {step === 'generating' ? (
                           <Loader2 className="w-5 h-5 animate-spin text-braun-accent" />
                        ) : input.trim() ? (
                           <button
                              onClick={handleGenerate}
                              className="bg-braun-accent hover:bg-orange-700 text-white p-1.5 rounded-full transition-colors shadow-md"
                           >
                              <ArrowRight className="w-4 h-4" />
                           </button>
                        ) : (
                           null
                        )}
                     </div>
                  </div>
               </div>


               {/* Body: Conditional Rendering */}
               {step === 'idle' ? (
                  /* Original Demo Content */
                  <div className="grid md:grid-cols-2 h-[400px] bg-[#F9F9F7]">

                     {/* Left List */}
                     <div className="p-6 border-r border-gray-200 hidden md:block overflow-y-auto">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('hero.demo.list')}</div>
                        <div className="space-y-2">
                           <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                              <div className="flex gap-3 items-center">
                                 <div className="w-5 h-5 rounded bg-braun-accent flex items-center justify-center text-white">
                                    <Check className="w-3 h-3" />
                                 </div>
                                 <div>
                                    <p className="font-medium text-sm text-braun-text">Ephemeral</p>
                                    <p className="text-xs text-gray-500">短暂的，转瞬即逝的</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm opacity-60">
                              <div className="flex gap-3 items-center">
                                 <div className="w-5 h-5 rounded border border-gray-200"></div>
                                 <div>
                                    <p className="font-medium text-sm text-braun-text">Serendipity</p>
                                    <p className="text-xs text-gray-500">机缘凑巧</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm opacity-40">
                              <div className="flex gap-3 items-center">
                                 <div className="w-5 h-5 rounded border border-gray-200"></div>
                                 <div>
                                    <p className="font-medium text-sm text-braun-text">Eloquent</p>
                                    <p className="text-xs text-gray-500">雄辩的</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Right Preview */}
                     <div className="p-6 md:p-8 flex flex-col items-center justify-center relative">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 absolute top-4 left-4 md:top-6 md:left-6">{t('hero.demo.preview')}</div>

                        <div className="w-full max-w-[200px] md:max-w-[220px] aspect-square bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center text-center p-5 relative hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
                           <div className="mb-1 text-gray-400 text-xs font-mono">/əˈfem.ər.əl/</div>
                           <h3 className="text-xl md:text-2xl font-bold text-braun-text mb-2 tracking-tight">Ephemeral</h3>
                           <p className="text-gray-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t('hero.demo.clickToFlip')}</p>
                        </div>
                     </div>
                  </div>
               ) : (
                  /* Real Functionality Content (Card Generation Results) */
                  <div className="h-[400px] bg-gray-50/50 overflow-hidden relative">
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

                                 {/* Scrollable List with Fade Mask */}
                                 <div className="flex-1 overflow-y-auto min-h-0 relative group">
                                    {/* Top/Bottom Fade Masks */}
                                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#F9F9F7] to-transparent z-10 pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#F9F9F7] to-transparent z-10 pointer-events-none" />

                                    <div className="px-4 py-2 space-y-2 content-start pb-8 pt-2">
                                       {candidates.map((card, i) => (
                                          <motion.div
                                             key={i}
                                             layoutId={`card-${i}`}
                                             onClick={() => setFocusedIndex(i)}
                                             className={cn(
                                                "relative flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none",
                                                focusedIndex === i
                                                   ? "bg-white border-braun-accent shadow-sm scale-[1.02] z-10"
                                                   : "bg-white border-gray-100 hover:border-gray-200 hover:bg-white/50"
                                             )}
                                          >
                                             <div className="flex gap-3 items-center min-w-0">
                                                <div
                                                   className={cn(
                                                      "w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0",
                                                      selectedIndices.has(i)
                                                         ? "bg-braun-accent text-white"
                                                         : "border border-gray-200 bg-gray-50"
                                                   )}
                                                   onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleSelection(i);
                                                   }}
                                                >
                                                   {selectedIndices.has(i) && <Check className="w-3 h-3" />}
                                                </div>
                                                <div className="min-w-0">
                                                   <p className={cn(
                                                      "font-medium text-sm truncate transition-colors",
                                                      focusedIndex === i ? "text-braun-text" : "text-gray-600"
                                                   )}>
                                                      {card.front}
                                                   </p>
                                                   <p className="text-xs text-gray-400 truncate max-w-[140px]">
                                                      {card.translation}
                                                   </p>
                                                </div>
                                             </div>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              {/* Right Column: Preview Detail */}
                              <div className="bg-[#F4F4F0] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 absolute top-6 left-6">Preview</div>

                                 {focusedIndex !== null && candidates[focusedIndex] ? (
                                    <motion.div
                                       key={focusedIndex}
                                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       transition={{ duration: 0.2 }}
                                       className="w-full max-w-sm aspect-square bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center justify-center text-center p-6 md:p-8 relative"
                                    >
                                       {candidates[focusedIndex].phonetic && (
                                          <div className="mb-2 md:mb-3 text-gray-400 text-xs md:text-sm font-mono tracking-wide">
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
               )}

            </div>
         </div>
      </section>
   );
}

