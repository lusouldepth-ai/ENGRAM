'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, Sparkles, Plus } from 'lucide-react';
import { generateCards } from '@/app/actions/generate-cards';
import { saveCards, type CardData } from '@/app/actions/save-cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CommandBar() {
  const [input, setInput] = useState('');
  const [candidates, setCandidates] = useState<CardData[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [step, setStep] = useState<'idle' | 'generating' | 'review' | 'saved'>('idle');

  const handleGenerate = () => {
    if (!input.trim()) return;
    setStep('generating');
    startGenerating(async () => {
      const result = await generateCards(input);
      if (result.success && result.data) {
        setCandidates(result.data);
        // Default select all
        setSelectedIndices(new Set(result.data.map((_, i) => i)));
        setStep('review');
      } else {
        // Handle error
        setStep('idle');
        console.error(result.error);
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

  const handleSave = () => {
    startSaving(async () => {
      const selectedCards = candidates.filter((_, i) => selectedIndices.has(i));
      const deckTitle = input.slice(0, 20) + (input.length > 20 ? '...' : ''); // Simple deck title
      const result = await saveCards(selectedCards, deckTitle);
      
      if (result.success) {
        setStep('saved');
        // Reset after delay or redirect
        setTimeout(() => {
           setStep('idle');
           setInput('');
           setCandidates([]);
        }, 2000);
      } else {
        console.error(result.error);
        // Handle auth error or other
        alert("Failed to save. Please make sure you are logged in (Auth is not yet fully implemented in UI).");
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8">
      
      {/* Input Section */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Sparkles className={cn("w-5 h-5 transition-colors", step === 'idle' ? "text-braun-accent" : "text-gray-400")} />
        </div>
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && step === 'idle' && input.trim()) {
              handleGenerate();
            }
          }}
          placeholder="What do you want to learn today?" 
          className="pl-12 pr-4 py-6 text-lg bg-white border-none shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-braun-accent/50 placeholder:text-gray-400"
          disabled={step !== 'idle'}
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          {step === 'idle' && input.trim() && (
             <Button 
               size="sm" 
               variant="ghost"
               className="text-xs text-gray-500 hover:text-braun-accent"
               onClick={handleGenerate}
             >
               Cmd+K
             </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {step === 'generating' && (
        <div className="space-y-3">
           <Skeleton className="h-16 w-full rounded-xl" />
           <Skeleton className="h-16 w-full rounded-xl" />
           <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {/* Review List */}
      {step === 'review' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
           <div className="flex items-center justify-between px-2">
             <h3 className="text-sm font-medium text-gray-500">Generated {candidates.length} cards</h3>
             <Button 
               onClick={handleSave} 
               disabled={isSaving || selectedIndices.size === 0}
               className="bg-braun-accent hover:bg-orange-700 text-white rounded-full px-6 transition-all"
             >
               {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
               Save to Deck
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
                   "group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                   selectedIndices.has(i) 
                     ? "bg-white border-braun-accent/30 shadow-sm" 
                     : "bg-gray-50 border-transparent opacity-60 hover:opacity-100"
                 )}
                 onClick={() => toggleSelection(i)}
               >
                 <Checkbox 
                   checked={selectedIndices.has(i)} 
                   onCheckedChange={() => toggleSelection(i)}
                   className="mt-1 data-[state=checked]:bg-braun-accent data-[state=checked]:border-braun-accent"
                 />
                 <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h4 className="font-semibold text-braun-text text-lg truncate">{card.front}</h4>
                      <span className="text-xs text-gray-400 font-mono">{card.phonetic}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{card.definition}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{card.pos}</span>
                      <span className="truncate max-w-[200px]">{card.translation}</span>
                    </div>
                 </div>
               </motion.div>
             ))}
           </div>
        </motion.div>
      )}

      {/* Saved State */}
      {step === 'saved' && (
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center py-12"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-braun-text">Saved to Deck</h3>
          <p className="text-gray-500">Ready for your review session.</p>
        </motion.div>
      )}
    </div>
  );
}
