"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile, completeOnboarding } from "@/app/actions/onboarding-actions";
import { Loader2, ArrowRight } from "lucide-react";

type Step = 'identity_goal' | 'level_accent' | 'loading';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('identity_goal');
  const [formData, setFormData] = useState({
    identity: "",
    goal: "",
    level: "",
    accent: ""
  });

  // Step 1 Handlers
  const handleIdentitySelect = (val: string) => setFormData(prev => ({ ...prev, identity: val }));
  const handleGoalSelect = (val: string) => setFormData(prev => ({ ...prev, goal: val }));
  
  const submitStep1 = async () => {
    if (!formData.identity || !formData.goal) return;
    // Save partial data (optional, but good for tracking drop-off)
    await updateProfile({ learning_goal: formData.goal });
    setStep('level_accent');
  };

  // Step 2 Handlers
  const handleLevelSelect = (val: string) => setFormData(prev => ({ ...prev, level: val }));
  const handleAccentSelect = (val: string) => setFormData(prev => ({ ...prev, accent: val }));

  const submitStep2 = async () => {
    if (!formData.level || !formData.accent) return;
    setStep('loading');
    
    // Save remaining profile data
    await updateProfile({ 
        english_level: formData.level,
        accent_preference: formData.accent 
    });

    // Trigger Magic
    const result = await completeOnboarding(formData.goal, formData.level);
    
    if (result.success) {
        router.push('/review');
    } else {
        alert("Something went wrong. Please try again.");
        setStep('level_accent');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-braun-bg text-braun-text animate-fade-in selection:bg-braun-accent selection:text-white">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: Identity & Goal */}
        {step === 'identity_goal' && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full space-y-12"
          >
            <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Who are you?</h2>
                <div className="grid grid-cols-3 gap-4">
                    {["Student", "Professional", "Traveler"].map((opt) => (
                        <SelectionButton 
                            key={opt} 
                            selected={formData.identity === opt} 
                            onClick={() => handleIdentitySelect(opt)}
                        >
                            {opt}
                        </SelectionButton>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Primary Focus?</h2>
                <div className="grid grid-cols-3 gap-4">
                    {["IELTS", "Business", "Daily Life"].map((opt) => (
                        <SelectionButton 
                            key={opt} 
                            selected={formData.goal === opt} 
                            onClick={() => handleGoalSelect(opt)}
                        >
                            {opt}
                        </SelectionButton>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <Button 
                    onClick={submitStep1}
                    disabled={!formData.identity || !formData.goal}
                    className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                >
                    Next <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Level & Accent */}
        {step === 'level_accent' && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full space-y-12"
          >
            <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Current Level?</h2>
                <div className="grid grid-cols-3 gap-4">
                    {["Novice", "Intermediate", "Advanced"].map((opt) => (
                        <SelectionButton 
                            key={opt} 
                            selected={formData.level === opt} 
                            onClick={() => handleLevelSelect(opt)}
                        >
                            {opt}
                        </SelectionButton>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Accent Preference?</h2>
                <div className="grid grid-cols-2 gap-4">
                    {["American (US)", "British (UK)"].map((opt) => (
                        <SelectionButton 
                            key={opt} 
                            selected={formData.accent === opt} 
                            onClick={() => handleAccentSelect(opt)}
                        >
                            {opt}
                        </SelectionButton>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <Button 
                    onClick={submitStep2}
                    disabled={!formData.level || !formData.accent}
                    className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                >
                    Generate Plan <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Loading */}
        {step === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-braun-accent" />
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-2 text-braun-text">Designing your plan...</h2>
                <p className="text-xl text-braun-gray">AI is curating your starter deck based on your profile.</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function SelectionButton({ children, selected, onClick }: { children: React.ReactNode, selected: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`
                p-6 rounded-xl border text-lg font-medium transition-all duration-200 text-left
                ${selected 
                    ? "bg-braun-text text-white border-braun-text shadow-lg scale-[1.02]" 
                    : "bg-white border-braun-border text-braun-text hover:border-braun-accent hover:shadow-md"
                }
            `}
        >
            {children}
        </button>
    )
}

