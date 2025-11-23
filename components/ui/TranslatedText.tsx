"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";

interface TranslatedTextProps {
    tKey: string;
    defaultText?: string;
    className?: string;
}

export function TranslatedText({ tKey, defaultText, className }: TranslatedTextProps) {
    const { t } = useLanguage();
    return <span className={className}>{t(tKey) || defaultText || tKey}</span>;
}
