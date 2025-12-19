"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { CardData } from "@/app/actions/save-cards";

interface WheelPickerProps {
    items: CardData[];
    selectedIndex: number;
    onIndexChange: (index: number) => void;
    onToggleSelection: (index: number) => void;
    selectedIndices: Set<number>;
}

// --- Configuration ---
const ITEM_HEIGHT = 64;
const ROTATION_PER_ITEM = 18; // degrees

// --- Audio Hook ---
function useWheelSound(selectedIndex: number) {
    const lastPlayedIndex = useRef<number>(selectedIndex);
    const lastPlayTime = useRef<number>(0);

    useEffect(() => {
        if (selectedIndex !== lastPlayedIndex.current) {
            const now = Date.now();
            if (now - lastPlayTime.current > 50) {
                try {
                    const audio = new Audio("/sounds/tick.wav");
                    audio.volume = 0.3;
                    audio.play().catch(() => { });
                    lastPlayTime.current = now;
                } catch (e) { }
            }
            lastPlayedIndex.current = selectedIndex;
        }
    }, [selectedIndex]);
}

export function WheelPicker({
    items,
    selectedIndex,
    onIndexChange,
    onToggleSelection,
    selectedIndices
}: WheelPickerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const isScrolling = useRef(false);
    const scrollEndTimer = useRef<NodeJS.Timeout | null>(null);

    useWheelSound(selectedIndex);

    // Handle scroll with debounced snap
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;

        const scrollTop = scrollRef.current.scrollTop;
        setScrollProgress(scrollTop);

        const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
        if (newIndex >= 0 && newIndex < items.length && newIndex !== selectedIndex) {
            onIndexChange(newIndex);
        }

        // Debounce scroll end detection
        isScrolling.current = true;
        if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
        scrollEndTimer.current = setTimeout(() => {
            isScrolling.current = false;
            // Snap to nearest item
            if (scrollRef.current) {
                const snapIndex = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
                const clampedIndex = Math.max(0, Math.min(snapIndex, items.length - 1));
                scrollRef.current.scrollTo({
                    top: clampedIndex * ITEM_HEIGHT,
                    behavior: "smooth"
                });
            }
        }, 80);
    }, [items.length, selectedIndex, onIndexChange]);

    // Initial scroll position
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
            setScrollProgress(selectedIndex * ITEM_HEIGHT);
        }
    }, []);

    // Handle item click - CRITICAL: Use onPointerDown for reliability
    const handleItemPointerDown = useCallback((index: number) => {
        console.log("🎯 Item clicked:", index, items[index]?.front);

        // If not the current center item, scroll to it
        if (index !== selectedIndex) {
            scrollRef.current?.scrollTo({
                top: index * ITEM_HEIGHT,
                behavior: "smooth"
            });
            onIndexChange(index);
        }

        // Toggle selection
        onToggleSelection(index);
    }, [selectedIndex, onIndexChange, onToggleSelection, items]);

    return (
        <div className="relative w-full h-full bg-[#F9F9F7] overflow-hidden">
            {/* Center Selection Highlight */}
            <div
                className="absolute left-2 right-2 top-1/2 -translate-y-1/2 bg-white/50 border-y-2 border-braun-accent/30 backdrop-blur-sm rounded-xl pointer-events-none z-0"
                style={{ height: ITEM_HEIGHT + 12 }}
            />

            {/* SCROLL CONTAINER - CSS Scroll Snap */}
            <div
                ref={scrollRef}
                className="absolute inset-0 overflow-y-auto no-scrollbar z-10"
                onScroll={handleScroll}
                style={{
                    scrollSnapType: "y mandatory",
                    // Container perspective for 3D children
                    perspective: "800px",
                    perspectiveOrigin: "center center",
                }}
            >
                {/* Top Spacer */}
                <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />

                {/* ITEMS - Using normal document flow, not absolute positioning */}
                <div
                    className="relative"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {items.map((item, index) => {
                        // Calculate offset from center
                        const scrollTop = scrollProgress;
                        const itemCenter = index * ITEM_HEIGHT;
                        const offset = (scrollTop - itemCenter) / ITEM_HEIGHT;
                        const absOffset = Math.abs(offset);

                        // 3D transforms - KEEP translateZ small to not break hit testing
                        const rotateX = offset * ROTATION_PER_ITEM;
                        // Use scale instead of translateZ for depth effect
                        const scale = Math.max(0.85, 1 - absOffset * 0.08);
                        const opacity = Math.max(0.3, 1 - absOffset * 0.4);
                        const isFocused = selectedIndex === index;
                        const isSelected = selectedIndices.has(index);

                        return (
                            <div
                                key={`item-${index}`}
                                className={cn(
                                    "relative flex items-center gap-4 px-4 mx-2 rounded-xl cursor-pointer select-none",
                                    "transition-colors duration-100",
                                    // DEBUG BORDERS - REMOVE AFTER FIXING
                                    isFocused
                                        ? "border-2 border-red-500 bg-white/30"
                                        : "border border-blue-300/50",
                                    // Hover state
                                    "hover:bg-white/40 active:bg-white/60"
                                )}
                                style={{
                                    height: ITEM_HEIGHT,
                                    scrollSnapAlign: "center",
                                    // 3D Transform - No translateZ to keep hit testing working
                                    transform: `rotateX(${rotateX}deg) scale(${scale})`,
                                    transformOrigin: "center center",
                                    opacity,
                                    // z-index based on distance from center (closer = higher)
                                    zIndex: 100 - Math.round(absOffset * 10),
                                    // CRITICAL: Ensure clickable
                                    pointerEvents: "auto",
                                }}
                                // Use onPointerDown instead of onClick for better reliability
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    handleItemPointerDown(index);
                                }}
                            >
                                {/* Checkbox */}
                                <div
                                    className={cn(
                                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0",
                                        "transition-all duration-150",
                                        isSelected
                                            ? "bg-braun-accent border-braun-accent text-white shadow-lg"
                                            : "bg-white border-gray-300"
                                    )}
                                >
                                    {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "font-semibold truncate",
                                        isFocused ? "text-lg text-braun-text" : "text-base text-gray-600"
                                    )}>
                                        {item.front}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {item.translation}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Spacer */}
                <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />
            </div>

            {/* Gradient Overlays - pointer-events: none */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#F9F9F7] to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F9F9F7] to-transparent pointer-events-none z-20" />
        </div>
    );
}
