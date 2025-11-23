import { Button } from "@/components/ui/button";
import { RefreshCw, Play, Mic, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ShadowPlayerProps {
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

export function ShadowPlayer({
    shadowSentence,
    isPro,
    resolvedShadowRate,
    setResolvedShadowRate,
    handleShuffle,
    isShuffling,
    handleShadowPlay,
    isShadowSpeaking,
    handleRecordToggle,
    isRecording,
    recordedUrl,
}: ShadowPlayerProps) {
    const router = useRouter();

    return (
        <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shadowing</h4>
                {isPro ? (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        PRO
                    </span>
                ) : (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                        Pro Only
                    </span>
                )}
            </div>

            <div
                className={cn("relative transition-all", !isPro && "group cursor-pointer")}
                onClick={() => {
                    if (!isPro) router.push("/pricing");
                }}
            >
                <p
                    className={cn(
                        "text-base font-serif leading-relaxed transition-all text-braun-text",
                        !isPro && "blur-sm select-none opacity-50"
                    )}
                >
                    {shadowSentence || "This is a long, rhythmic sentence designed for shadowing practice."}
                </p>

                {!isPro && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border flex items-center gap-2">
                            <Lock className="w-3 h-3 text-braun-accent" />
                            <span className="text-xs font-medium text-braun-text">Unlock Pro</span>
                        </div>
                    </div>
                )}
            </div>

            {isPro && (
                <div className="space-y-3">
                    {/* Controls */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                            {[0.75, 1.0, 1.25].map((rate) => (
                                <button
                                    key={rate}
                                    onClick={() => setResolvedShadowRate(rate)}
                                    className={cn(
                                        "text-[10px] px-2 py-1 rounded-full transition-all",
                                        resolvedShadowRate === rate
                                            ? "bg-white shadow-sm text-braun-text font-bold"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShuffle}
                            disabled={isShuffling}
                            className="h-7 px-2 text-gray-400 hover:text-braun-accent"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isShuffling && "animate-spin")} />
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShadowPlay}
                            className={cn(
                                "flex-1 rounded-full h-9 text-xs font-medium",
                                isShadowSpeaking && "border-[#EA580C] text-[#EA580C] bg-[#EA580C]/5"
                            )}
                        >
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            {isShadowSpeaking ? "Playing..." : "Listen"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRecordToggle}
                            className={cn(
                                "flex-1 rounded-full h-9 text-xs font-medium",
                                isRecording && "border-red-400 text-red-500 bg-red-50"
                            )}
                        >
                            <Mic className="w-3.5 h-3.5 mr-1.5" />
                            {isRecording ? "Stop" : "Record"}
                        </Button>
                    </div>
                </div>
            )}

            {recordedUrl && (
                <div className="pt-2">
                    <audio controls src={recordedUrl} className="w-full h-8" />
                </div>
            )}
        </div>
    );
}
