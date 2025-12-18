'use client';

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const isEnglish = language === 'en';

  const toggle = () => {
    setLanguage(isEnglish ? 'cn' : 'en');
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Language selection">
      <span
        className={cn("text-xs font-medium transition-colors", !isEnglish ? "text-braun-text" : "text-gray-400")}
        aria-hidden="true"
      >
        CN
      </span>

      <button
        onClick={toggle}
        role="switch"
        aria-checked={isEnglish}
        aria-label={isEnglish ? "Switch to Chinese" : "Switch to English"}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isEnglish ? "bg-braun-accent" : "bg-[#E5E5E5]"
        )}
      >
        <span className="sr-only">
          {isEnglish ? "English selected, click to switch to Chinese" : "Chinese selected, click to switch to English"}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            isEnglish ? "translate-x-5" : "translate-x-0"
          )}
        ></span>
      </button>

      <span
        className={cn("text-xs font-medium transition-colors", isEnglish ? "text-braun-text" : "text-gray-400")}
        aria-hidden="true"
      >
        EN
      </span>
    </div>
  );
}
