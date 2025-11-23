"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile, generateStarterCards, saveStarterCards } from "@/app/actions/onboarding-actions";
import { Loader2, ArrowRight, Check, X } from "lucide-react";
import { CardData } from "@/app/actions/save-cards";

type Step = 'identity_goal' | 'level_accent' | 'loading' | 'selection';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('identity_goal');
    const [formData, setFormData] = useState({
        identity: "",
        goal: "",
        target_score: "",
        exam_date: "",
        level: "",
        accent: ""
    });
    const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
    const [selectedCardIndices, setSelectedCardIndices] = useState<Set<number>>(new Set());

    // Step 1 Handlers
    const handleIdentitySelect = (val: string) => setFormData(prev => ({ ...prev, identity: val }));
    const handleGoalSelect = (val: string) => setFormData(prev => ({ ...prev, goal: val, target_score: "", exam_date: "" })); // Reset conditional fields

    const submitStep1 = async () => {
        if (!formData.identity || !formData.goal) return;

        // Validate Exam fields if needed
        if ((formData.goal === "IELTS" || formData.goal === "TOEFL") && (!formData.target_score || !formData.exam_date)) {
            alert("Please fill in your target score and exam date.");
            return;
        }

        // Save partial data (optional, but good for tracking drop-off)
        await updateProfile({
            learning_goal: formData.goal,
            target_score: formData.target_score,
            exam_date: formData.exam_date
        });
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
        const result = await generateStarterCards(formData.goal, formData.level);

        if (result.success && result.cards) {
            setGeneratedCards(result.cards);
            // Default select all
            setSelectedCardIndices(new Set(result.cards.map((_: any, i: number) => i)));
            setStep('selection');
        } else {
            alert("Something went wrong. Please try again.");
            setStep('level_accent');
        }
    };

    const toggleCardSelection = (index: number) => {
        const newSet = new Set(selectedCardIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedCardIndices(newSet);
    };

    const submitSelection = async () => {
        if (selectedCardIndices.size === 0) {
            alert("Please select at least one card to start.");
            return;
        }

        const cardsToSave = generatedCards.filter((_, i) => selectedCardIndices.has(i));
        const result = await saveStarterCards(cardsToSave);

        if (result.success) {
            router.push('/dashboard');
        } else {
            alert("Failed to save cards. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-braun-bg text-braun-text animate-fade-in selection:bg-braun-accent selection:text-white py-12">
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

                            {/* Conditional Inputs for Exams */}
                            {(formData.goal === "IELTS" || formData.goal === "TOEFL") && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="grid grid-cols-2 gap-4 pt-2"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Target Score</label>
                                        <Input
                                            placeholder={formData.goal === "IELTS" ? "e.g. 7.0" : "e.g. 100"}
                                            value={formData.target_score}
                                            onChange={(e) => setFormData(prev => ({ ...prev, target_score: e.target.value }))}
                                            className="bg-white border-gray-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Exam Date</label>
                                        <Input
                                            type="date"
                                            value={formData.exam_date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                                            className="bg-white border-gray-200"
                                        />
                                    </div>
                                </motion.div>
                            )}
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
                        exit={{ opacity: 0 }}
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

                {/* STEP 4: Selection */}
                {step === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Your Starter Deck</h2>
                            <p className="text-gray-500">Select the words you want to learn. Uncheck the ones you already know.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {generatedCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => toggleCardSelection(idx)}
                                    className={`
                                cursor-pointer p-5 rounded-xl border transition-all duration-200 relative group
                                ${selectedCardIndices.has(idx)
                                            ? "bg-white border-braun-accent shadow-md ring-1 ring-braun-accent"
                                            : "bg-gray-50 border-transparent opacity-60 hover:opacity-100"
                                        }
                            `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-braun-text">{card.front}</h3>
                                        <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                    ${selectedCardIndices.has(idx) ? "bg-braun-accent text-white" : "bg-gray-200 text-gray-400"}
                                `}>
                                            {selectedCardIndices.has(idx) ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 italic mb-2">{card.pos} {card.phonetic}</p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{card.definition}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                                {selectedCardIndices.size} cards selected
                            </div>
                            <Button
                                onClick={submitSelection}
                                disabled={selectedCardIndices.size === 0}
                                className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                            >
                                Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
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
