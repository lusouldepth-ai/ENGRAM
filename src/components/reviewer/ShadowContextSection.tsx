'use client';

import { Volume2, RotateCcw, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShadowContextSectionProps {
    shadowSentence: string;
    displayTranslation: string;
    contextTag: string;
    isPro: boolean;
    isShuffling: boolean;
    handleShuffle: () => void;
    playbackSpeed: number;
    setPlaybackSpeed: (speed: number) => void;
    handleShadowPlay: () => void;
    isShadowSpeaking: boolean;
    handleRecordToggle: () => void;
    isRecording: boolean;
    handlePlayRecording: () => void;
    recordedUrl: string | null;
}

export function ShadowContextSection({
    shadowSentence,
    displayTranslation,
    contextTag,
    isPro,
    isShuffling,
    handleShuffle,
    playbackSpeed,
    setPlaybackSpeed,
    handleShadowPlay,
    isShadowSpeaking,
    handleRecordToggle,
    isRecording,
    handlePlayRecording,
    recordedUrl,
}: ShadowContextSectionProps) {
    return (
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
    );
}
