import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface StudyCardFrontProps {
    userInput: string;
    setUserInput: (val: string) => void;
    handleSubmit: (e: React.KeyboardEvent) => void;
    handlePlay: () => void;
    isSpeaking: boolean;
    isCorrect: boolean | null;
}

export const StudyCardFront = forwardRef<HTMLInputElement, StudyCardFrontProps>(
    ({ userInput, setUserInput, handleSubmit, handlePlay, isSpeaking, isCorrect }, ref) => {
        return (
            <div
                className="absolute w-full h-full bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden" }}
            >
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Play pronunciation"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePlay();
                        }}
                        className={cn(
                            "rounded-full h-16 w-16 bg-gray-50 hover:bg-gray-100 transition-colors",
                            isSpeaking && "bg-[#EA580C]/10 text-[#EA580C]"
                        )}
                    >
                        <Volume2 className={cn("w-8 h-8", isSpeaking ? "text-[#EA580C]" : "text-gray-600")} />
                    </Button>
                </div>

                <Input
                    ref={ref}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleSubmit}
                    placeholder="Type what you hear..."
                    className={cn(
                        "text-center text-2xl font-medium border-0 border-b-2 rounded-none focus-visible:ring-0 px-4 py-2 bg-transparent placeholder:text-gray-300 transition-colors",
                        isCorrect === true
                            ? "border-green-500 text-green-600"
                            : "border-gray-200 focus-visible:border-braun-accent"
                    )}
                />

                <p className="mt-4 text-xs text-gray-400">Press Enter to flip</p>
            </div>
        );
    }
);

StudyCardFront.displayName = "StudyCardFront";
