import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyCardFrontProps {
    userInput: string;
    setUserInput: (value: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handlePlayAudio: () => void;
    handleCheck: () => void;
    handleReveal: () => void;
    isSpeaking: boolean;
    isCorrect: boolean | null;
    isFlipped: boolean;
}

export function StudyCardFront({
    userInput,
    setUserInput,
    handleSubmit,
    handlePlayAudio,
    handleCheck,
    handleReveal,
    isSpeaking,
    isCorrect,
    isFlipped,
}: StudyCardFrontProps) {
    return (
        <div
            className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 flex flex-col items-center justify-center transition-all duration-500"
            style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)"
            }}
            role="region"
            aria-label="Study card front - listen and type"
        >
            <div className="flex flex-col items-center gap-8 w-full max-w-sm">
                {/* Large Volume Button */}
                <button
                    onClick={handlePlayAudio}
                    disabled={isSpeaking}
                    aria-label={isSpeaking ? "Playing audio..." : "Play audio pronunciation"}
                    aria-busy={isSpeaking}
                    className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center transition-colors mb-4 border border-neutral-100",
                        isSpeaking
                            ? "bg-orange-50 text-orange-500"
                            : "bg-neutral-50 hover:bg-orange-50 text-neutral-400 hover:text-orange-500"
                    )}
                >
                    <Volume2 size={40} aria-hidden="true" />
                </button>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="w-full relative" aria-label="Answer form">
                    <label htmlFor="answer-input" className="sr-only">
                        Type what you hear
                    </label>
                    <input
                        id="answer-input"
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type what you hear..."
                        aria-describedby="answer-feedback"
                        className={cn(
                            "w-full text-center text-2xl font-light border-b-2 bg-transparent py-2 outline-none transition-colors",
                            isCorrect === null
                                ? "border-neutral-200 text-neutral-800"
                                : isCorrect
                                    ? "border-green-500 text-green-600"
                                    : "border-red-500 text-red-600"
                        )}
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        disabled={isFlipped}
                    />
                    <span id="answer-feedback" className="sr-only">
                        {isCorrect === null ? "" : isCorrect ? "Correct!" : "Incorrect, try again"}
                    </span>
                </form>

                {/* Check / Reveal Buttons */}
                <div className="flex gap-2" role="group" aria-label="Action buttons">
                    <Button
                        type="button"
                        onClick={handleCheck}
                        aria-label="Check your answer"
                        className="bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm rounded-lg text-sm px-5 py-2.5"
                    >
                        Check
                    </Button>
                    <Button
                        type="button"
                        onClick={handleReveal}
                        aria-label="Reveal the answer"
                        className="bg-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md text-sm px-5 py-2.5"
                    >
                        Reveal
                    </Button>
                </div>
            </div>
        </div>
    );
}
