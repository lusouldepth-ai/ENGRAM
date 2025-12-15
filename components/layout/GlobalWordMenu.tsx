'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Volume2, Plus, Check, X } from 'lucide-react';
import { generateCards } from '@/app/actions/generate-cards';
import { saveCards } from '@/app/actions/save-cards';
import { playHighQualitySpeech } from '@/lib/services/ttsService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

// Define a type for the card data we expect
type CardData = {
    front: string;
    translation: string;
    phonetic?: string;
    pos?: string;
    [key: string]: any;
};

export function GlobalWordMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cardData, setCardData] = useState<CardData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [accent, setAccent] = useState<'US' | 'UK'>('US');

    const menuRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // 获取用户的口音偏好
    useEffect(() => {
        async function fetchAccentPreference() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('accent_preference')
                    .eq('id', user.id)
                    .single();

                if (profile?.accent_preference) {
                    const pref = profile.accent_preference.toLowerCase();
                    setAccent(pref.includes('uk') || pref.includes('british') ? 'UK' : 'US');
                }
            }
        }
        fetchAccentPreference();
    }, [supabase]);

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            // Check if the target is within an input or textarea
            // If so, we might want to allow default browser behavior (copy/paste)
            // But for now, if text is selected, we override.
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            const selection = window.getSelection();
            const text = selection ? selection.toString().trim() : '';

            // Only trigger if text is selected
            if (text && text.length > 0 && text.length < 50) {
                // If inside input, user might want native menu. 
                // Strategy: If user holds SHIFT, let them access native menu?
                // Or just always override if selection exists. Let's override for consistency with "global lookup".

                e.preventDefault(); // Prevent default browser context menu

                const x = e.clientX;
                const y = e.clientY;

                // Adjust position to keep inside viewport
                // We'll do basic clamping in render or just rely on CSS to some extent, 
                // but initial position is cursor.
                setPosition({ x, y });
                setSelectedText(text);
                setIsOpen(true);
                setIsSaved(false);
                setCardData(null);

                // Immediately start fetching translation
                fetchTranslation(text);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const fetchTranslation = async (text: string) => {
        setIsLoading(true);
        try {
            // Request only 1 card for speed
            const result = await generateCards(text, undefined, 1);

            if (result.success && result.data && result.data.length > 0) {
                setCardData(result.data[0]);
            } else {
                console.error("Failed to generate card preview");
            }
        } catch (error) {
            console.error("Error generating card:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAudio = async () => {
        // Allow playing selected text immediately even if card data is loading
        const textToPlay = cardData?.front || selectedText;
        if (!textToPlay) return;
        if (isSpeaking) return;

        setIsSpeaking(true);
        try {
            await playHighQualitySpeech(textToPlay, 'US');
        } finally {
            setIsSpeaking(false);
        }
    };

    const handleQuickAdd = async () => {
        if (!cardData || isSaving) return;

        setIsSaving(true);
        try {
            const result = await saveCards([cardData], "Quick Add");
            if (result.success) {
                setIsSaved(true);
                // Close menu after a short delay or let user close it
                setTimeout(() => setIsOpen(false), 1500);
            }
        } catch (error) {
            console.error("Failed to save card:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Portal to document.body to ensure it floats above everything
    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(0, 0)'
            }}
        >
            <Card className="w-72 p-4 shadow-xl border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 mr-2">
                        <h3 className="font-serif text-lg font-medium text-neutral-900 line-clamp-1 break-all">
                            {selectedText}
                        </h3>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Translating...</span>
                            </div>
                        ) : cardData ? (
                            <div className="mt-1">
                                <p className="text-sm font-medium text-neutral-700">
                                    {cardData.translation}
                                </p>
                                <div className="flex gap-2 mt-1 text-xs text-neutral-500">
                                    <span>{cardData.phonetic}</span>
                                    <span>{cardData.pos}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-red-400 mt-1">Translation unavailable</p>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-neutral-400 hover:text-neutral-600 p-1 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Show buttons always if we have text, disabled states handle logic */}
                <div className="flex mt-4 border border-neutral-200 rounded-md overflow-hidden">
                    <button
                        className="flex-1 inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors h-9 px-3 gap-2 text-neutral-600 bg-white hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50 disabled:pointer-events-none border-r border-neutral-200"
                        onClick={handlePlayAudio}
                        disabled={isSpeaking}
                    >
                        <Volume2 size={14} className={isSpeaking ? "text-orange-500" : ""} />
                        Play
                    </button>
                    <button
                        className={`flex-1 inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all h-9 px-3 gap-2 disabled:opacity-50 disabled:pointer-events-none ${isSaved
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-neutral-900 text-white hover:bg-neutral-800"
                            }`}
                        onClick={handleQuickAdd}
                        disabled={isSaving || isSaved || isLoading || !cardData}
                    >
                        {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : isSaved ? (
                            <>
                                <Check size={14} />
                                Added
                            </>
                        ) : (
                            <>
                                <Plus size={14} />
                                Add
                            </>
                        )}
                    </button>
                </div>
            </Card>
        </div>,
        document.body
    );
}
