import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShadowPlayer } from "./ShadowPlayer";
import { Database } from "@/lib/supabase/types";

type Card = Database["public"]["Tables"]["cards"]["Row"] & {
    audio_url?: string | null;
};

interface StudyCardBackProps {
    card: Card;
    userInput: string;
    displayTarget: string;
    rawTarget: string;
    isCorrect: boolean | null;
    handleSelection: () => void;
    handleExamplePlay: (text: string) => void;
    // Shadow Props
    shadowSentence: string;
    isPro: boolean;
    resolvedShadowRate: number;
    setResolvedShadowRate: (rate: number) => void;
    handleShuffle: () => void;
    isShuffling: boolean;
    handleShadowPlay: () => void;
    isShadowSpeaking: boolean;
    handleRecordToggle: () => void;
    isRecording: boolean;
    recordedUrl: string | null;
}

export function StudyCardBack({
    card,
    userInput,
    displayTarget,
    rawTarget,
    isCorrect,
    handleSelection,
    handleExamplePlay,
    ...shadowProps
}: StudyCardBackProps) {
    return (
        <div
            className="absolute w-full h-full bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col p-6 overflow-y-auto no-scrollbar"
            style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
            onMouseUp={handleSelection}
        >
            {/* Result Header */}
            <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-braun-text mb-1">
                    <DiffResult input={userInput} target={displayTarget} rawTarget={rawTarget} />
                </h2>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                    <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">
                        {card.phonetic || "/.../"}
                    </span>
                    <span className="italic">{card.pos || "n."}</span>
                </div>
                {!isCorrect && (
                    <p className="text-base text-orange-600 mt-2 font-semibold tracking-tight">
                        Correct: {displayTarget}
                    </p>
                )}
            </div>

            {/* Context Content */}
            <div className="space-y-5 flex-1">
                {/* Definition */}
                <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meaning</h4>
                    <p className="text-gray-800 leading-relaxed text-sm">
                        {card.definition}
                        <span className="block text-gray-400 text-xs mt-1">{card.translation}</span>
                    </p>
                </div>

                {/* Short Example (Audio First) */}
                {card.example && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Example
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-braun-accent hover:bg-orange-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleExamplePlay(card.example!);
                                }}
                            >
                                <Volume2 className="w-3.5 h-3.5 mr-1" /> Listen
                            </Button>
                        </div>
                        <div
                            className="relative group cursor-pointer"
                            onClick={(e) => e.currentTarget.classList.toggle("reveal")}
                        >
                            <p className="text-gray-700 leading-relaxed text-sm blur-sm group-[.reveal]:blur-0 transition-all duration-300 select-none">
                                {card.example}
                            </p>
                            <div className="absolute inset-0 flex items-center justify-center group-[.reveal]:hidden pointer-events-none">
                                <span className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                                    Click to reveal
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shadow Sentence (Pro Feature) */}
                <ShadowPlayer {...shadowProps} />
            </div>
        </div>
    );
}

// Simple Diff Component
function DiffResult({
    input,
    target,
    rawTarget,
}: {
    input: string;
    target: string;
    rawTarget: string;
}) {
    const normalizedTarget = target || "";
    const normalizedInput = (input || "").toLowerCase();
    const isCorrect = normalizedInput.trim() === normalizedTarget.trim();

    if (isCorrect) {
        return <span className="text-green-600">{normalizedTarget}</span>;
    }

    return (
        <span className="tracking-wide text-[#1A1A1A] font-semibold">
            {normalizedTarget.split("").map((char, idx) => {
                const match = (normalizedInput[idx] || "").toLowerCase() === char.toLowerCase();
                return (
                    <span
                        key={`${rawTarget}-${idx}`}
                        className={cn("relative px-0.5 transition-colors", match ? "text-[#1A1A1A]" : "text-[#EA580C]")}
                    >
                        {char}
                        {!match && (
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-[2px] w-5/6 bg-[#EA580C]/40 rounded-full" />
                        )}
                    </span>
                );
            })}
        </span>
    );
}
