import { Button } from "@/components/ui/button";
import { Volume2, RotateCcw, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/lib/supabase/types";

type Card = Database["public"]["Tables"]["cards"]["Row"] & {
    audio_url?: string | null;
    shadow_sentence_translation?: string | null; // optional translation for shadow sentence
};

interface StudyCardBackProps {
    card: Card;
    userInput: string;
    displayTarget: string;
    rawTarget: string;
    isCorrect: boolean | null;
    handleSelection: () => void;
    handleExamplePlay: (text: string) => void;
    handleWordPlay: () => void;
    // Shadow Props
    shadowSentence: string;
    isPro: boolean;
    playbackSpeed: number;
    setPlaybackSpeed: (speed: number) => void;
    handleShadowPlay: () => void;
    isShadowSpeaking: boolean;
    handleRecordToggle: () => void;
    isRecording: boolean;
    handlePlayRecording: () => void;
    recordedUrl: string | null;
    handleShuffle: () => void;
    isShuffling: boolean;
    // Rating Props
    onRate: (grade: 'forgot' | 'hard' | 'good' | 'easy') => void;
    // Translation prop for shadow sentence
    shadowTranslation: string;
    // Dynamic interval previews from FSRS
    intervalPreviews?: {
        forgot: { display: string };
        hard: { display: string };
        good: { display: string };
        easy: { display: string };
    } | null;
    // Fixed translation (auto-corrected)
    fixedTranslation?: string | null;
}

export function StudyCardBack({
    card,
    userInput,
    displayTarget,
    rawTarget,
    isCorrect,
    handleSelection,
    handleExamplePlay,
    handleWordPlay,
    shadowSentence,
    isPro,
    playbackSpeed,
    setPlaybackSpeed,
    handleShadowPlay,
    isShadowSpeaking,
    handleRecordToggle,
    isRecording,
    handlePlayRecording,
    recordedUrl,
    handleShuffle,
    isShuffling,
    onRate,
    shadowTranslation,
    intervalPreviews,
    fixedTranslation,
}: StudyCardBackProps) {
    // Generate context tag based on shadow sentence content
    const getContextTag = () => {
        const text = shadowSentence.toLowerCase();
        if (text.includes('technolog') || text.includes('smartphone') || text.includes('digital')) return 'Technology';
        if (text.includes('art') || text.includes('beauty') || text.includes('aesthetic')) return 'Art';
        if (text.includes('business') || text.includes('market') || text.includes('economic')) return 'Business';
        if (text.includes('science') || text.includes('research') || text.includes('study')) return 'Science';
        return 'General';
    };

    const contextTag = getContextTag();

    // Use the prop for shadow translation
    const displayTranslation = shadowTranslation || (card.shadow_sentence_translation || "").trim();

    return (
        <div
            className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-neutral-200 flex flex-col transition-all duration-500 overflow-y-auto"
            style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
            }}
            onMouseUp={handleSelection}
        >
            {/* Sticky Header */}
            <div className="p-8 border-b border-neutral-100 bg-neutral-50 sticky top-0 z-20">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-4xl font-bold text-neutral-900 mb-2">
                            <DiffResult input={userInput} target={displayTarget} rawTarget={rawTarget} />
                        </h2>
                        <div className="flex items-center gap-3 text-neutral-500">
                            <span className="font-mono bg-neutral-200 px-2 py-0.5 rounded text-sm">
                                {card.phonetic || "/.../"}
                            </span>
                            <span className="italic text-sm">{card.pos || "n."}</span>
                            <button
                                onClick={handleWordPlay}
                                className="hover:text-orange-600 disabled:opacity-50"
                            >
                                <Volume2 size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg text-neutral-700">{fixedTranslation || card.translation}</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 space-y-8 flex-1">
                {/* Example Section */}
                {card.example && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                Example
                            </h3>
                            <button
                                onClick={() => handleExamplePlay(card.example!)}
                                className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
                            >
                                <Volume2 size={16} />
                            </button>
                        </div>
                        <p className="text-lg text-neutral-800 leading-relaxed font-light border-l-2 border-orange-500 pl-4">
                            {card.example}
                        </p>
                    </div>
                )}

                {/* Shadow Context Section */}
                {shadowSentence && (
                    <div className="space-y-3 bg-neutral-50 p-6 rounded-xl border border-neutral-100 relative group">
                        {/* Tag and Shuffle */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                                    {contextTag}
                                </span>
                            </div>
                            {isPro && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={handleShuffle}
                                        disabled={isShuffling}
                                        className="p-1 hover:bg-neutral-200 rounded"
                                        title="Regenerate Context"
                                    >
                                        <RotateCcw size={14} className={isShuffling ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Shadow Sentence */}
                        <p className="text-md text-neutral-700 leading-relaxed cursor-text selection:bg-orange-100 selection:text-orange-900">
                            {shadowSentence}
                        </p>

                        {/* Translation */}
                        <p className="text-sm text-neutral-400 mt-2 border-t border-neutral-200 pt-2">
                            {displayTranslation || "（该句暂缺翻译）"}
                        </p>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-4">
                            {/* Speed Controls */}
                            <div className="flex items-center gap-2 bg-white rounded-full p-1 border border-neutral-200 shadow-sm">
                                <button
                                    onClick={() => setPlaybackSpeed(0.7)}
                                    className={cn(
                                        "px-2 py-1 text-xs rounded-full",
                                        playbackSpeed === 0.7
                                            ? "bg-neutral-800 text-white"
                                            : "text-neutral-500"
                                    )}
                                >
                                    0.7x
                                </button>
                                <button
                                    onClick={() => setPlaybackSpeed(1.0)}
                                    className={cn(
                                        "px-2 py-1 text-xs rounded-full",
                                        playbackSpeed === 1.0
                                            ? "bg-neutral-800 text-white"
                                            : "text-neutral-500"
                                    )}
                                >
                                    1.0x
                                </button>
                                <button
                                    onClick={handleShadowPlay}
                                    disabled={isShadowSpeaking}
                                    className="p-1.5 text-neutral-800 hover:text-orange-600 disabled:opacity-50"
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>

                            {/* Shadow Recording Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRecordToggle}
                                    disabled={!isPro}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all relative",
                                        isRecording
                                            ? "border-red-500 text-red-600 bg-red-50 animate-pulse"
                                            : isPro
                                                ? "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                                                : "border-neutral-200 text-neutral-300 cursor-not-allowed"
                                    )}
                                >
                                    {isRecording && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                    )}
                                    <Mic size={16} className={isRecording ? "text-red-600" : ""} />
                                    <span className="text-xs font-medium">{isRecording ? "录音中..." : "录音"}</span>
                                </button>
                                <button
                                    onClick={handlePlayRecording}
                                    disabled={!recordedUrl}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-300 text-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed hover:border-neutral-400"
                                >
                                    <Volume2 size={16} />
                                    <span className="text-xs font-medium">播放录音</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Rating Buttons - Sticky Bottom */}
            <div className="p-4 border-t border-neutral-100 bg-white sticky bottom-0">
                <div className="grid grid-cols-4 gap-3">
                    <button
                        onClick={() => onRate('forgot')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase mb-1">Forgot</span>
                        <span className="text-[10px] text-red-400">{intervalPreviews?.forgot?.display || '1m'}</span>
                    </button>
                    <button
                        onClick={() => onRate('hard')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase mb-1">Hard</span>
                        <span className="text-[10px] text-neutral-400">{intervalPreviews?.hard?.display || '10m'}</span>
                    </button>
                    <button
                        onClick={() => onRate('good')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase mb-1">Good</span>
                        <span className="text-[10px] text-green-400">{intervalPreviews?.good?.display || '1d'}</span>
                    </button>
                    <button
                        onClick={() => onRate('easy')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                        <span className="text-xs font-bold uppercase mb-1">Easy</span>
                        <span className="text-[10px] text-blue-400">{intervalPreviews?.easy?.display || '4d'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Diff Result Component
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
        <span className="tracking-wide text-neutral-900 font-semibold">
            {normalizedTarget.split("").map((char, idx) => {
                const match = (normalizedInput[idx] || "").toLowerCase() === char.toLowerCase();
                return (
                    <span
                        key={`${rawTarget}-${idx}`}
                        className={cn("relative px-0.5 transition-colors", match ? "text-neutral-900" : "text-red-600")}
                    >
                        {char}
                        {!match && (
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-[2px] w-5/6 bg-red-600/40 rounded-full" />
                        )}
                    </span>
                );
            })}
        </span>
    );
}
