"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import AnimatedList from "@/components/ui/AnimatedList";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useState, useTransition, useRef } from "react";
import { generateCards } from "@/app/actions/generate-cards";
import { type CardData } from "@/app/actions/save-cards";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Lazy load the card generator component - contains framer-motion and WheelPicker
// This reduces initial bundle size by ~3MB as these are only loaded when user triggers generation
const HeroCardGenerator = dynamic(
   () => import("./HeroCardGenerator").then((mod) => ({ default: mod.HeroCardGenerator })),
   {
      ssr: false,
      loading: () => (
         <div className="h-[600px] bg-gray-50/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-braun-accent" />
         </div>
      )
   }
);

// Demo data for the AnimatedList
const DEMO_ITEMS = [
   { word: 'Ephemeral', translation: '短暂的，转瞬即逝的' },
   { word: 'Serendipity', translation: '机缘凑巧' },
   { word: 'Eloquent', translation: '雄辩的' },
   { word: 'Luminous', translation: '发光的，明亮的' },
   { word: 'Ethereal', translation: '轻飘的，空灵的' },
   { word: 'Resilient', translation: '有弹性的，坚韧的' },
   { word: 'Mellifluous', translation: '甜美流畅的' },
   { word: 'Ubiquitous', translation: '无处不在的' },
];

export function Hero() {
   const { t } = useLanguage();
   const router = useRouter();

   // -- CommandBar Logic Integration --
   const [input, setInput] = useState('');
   const [candidates, setCandidates] = useState<CardData[]>([]);
   const [isGenerating, startGenerating] = useTransition();
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
                  /* Original Demo Content - Static, no framer-motion */
                  <div className="grid md:grid-cols-2 h-[600px] bg-[#F9F9F7]">

                     {/* Left List - iOS Style 3D Wheel Picker */}
                     <div className="border-r border-gray-200 hidden md:flex flex-col overflow-hidden relative">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest p-6 pb-4 shrink-0">{t('hero.demo.list')}</div>

                        {/* AnimatedList - Vocabulary Demo */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                           <AnimatedList
                              items={DEMO_ITEMS}
                              showGradients={true}
                              enableArrowNavigation={false}
                              displayScrollbar={false}
                           />
                        </div>
                     </div>

                     {/* Right Preview */}
                     <div className="p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center relative h-full">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 absolute top-4 left-4 md:top-6 md:left-6">{t('hero.demo.preview')}</div>

                        <div className="w-full max-w-xs md:max-w-sm lg:max-w-md aspect-[4/5] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center justify-center text-center p-6 md:p-8 relative hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                           <div className="mb-2 text-gray-400 text-sm md:text-base font-mono">/əˈfem.ər.əl/</div>
                           <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-braun-text mb-3 tracking-tight">Ephemeral</h3>
                           <p className="text-gray-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{t('hero.demo.clickToFlip')}</p>
                        </div>
                     </div>
                  </div>
               ) : (
                  /* Dynamic Card Generator - Lazy loaded with framer-motion */
                  <HeroCardGenerator
                     candidates={candidates}
                     step={step}
                     onStepChange={setStep}
                  />
               )}

            </div>
         </div>
      </section>
   );
}
