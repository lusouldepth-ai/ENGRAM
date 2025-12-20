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
const ROTATION_PER_ITEM = 20; // degrees per item on the cylinder
const CYLINDER_RADIUS = 120; // virtual cylinder radius in px
const VISIBLE_ITEMS_BUFFER = 6; // items to render above/below center

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

/**
 * iOS-style 3D Wheel Picker Component
 * 
 * Uses dual-layer architecture:
 * 1. Visual Layer: 3D transformed items (pointer-events: none)
 * 2. Interaction Layer: Invisible scroll container with CSS snap
 * 
 * This separation allows for proper 3D transforms with translateZ
 * while maintaining reliable touch/click interactions.
 */
export function WheelPicker({
    items,
    selectedIndex,
    onIndexChange,
    onToggleSelection,
    selectedIndices
}: WheelPickerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const scrollEndTimer = useRef<NodeJS.Timeout | null>(null);

    useWheelSound(selectedIndex);

    // Calculate center index from scroll position
    const centerIndex = Math.round(scrollTop / ITEM_HEIGHT);

    // Initial scroll position
    useEffect(() => {
        if (scrollRef.current) {
            const initialScroll = selectedIndex * ITEM_HEIGHT;
            scrollRef.current.scrollTop = initialScroll;
            setScrollTop(initialScroll);
        }
    }, []);

    // Handle scroll events
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const scroll = scrollRef.current.scrollTop;
        setScrollTop(scroll);

        const newIndex = Math.round(scroll / ITEM_HEIGHT);
        if (newIndex >= 0 && newIndex < items.length && newIndex !== selectedIndex) {
            onIndexChange(newIndex);
        }

        // Debounce scroll end detection
        setIsDragging(true);
        if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
        scrollEndTimer.current = setTimeout(() => {
            setIsDragging(false);
        }, 150);
    }, [items.length, selectedIndex, onIndexChange]);

    // Handle item click from the interaction layer
    const handleItemClick = useCallback((index: number) => {
        // If not the current center item, scroll to it first
        if (index !== selectedIndex) {
            scrollRef.current?.scrollTo({
                top: index * ITEM_HEIGHT,
                behavior: "smooth"
            });
            onIndexChange(index);
        }
        // Toggle selection
        onToggleSelection(index);
    }, [selectedIndex, onIndexChange, onToggleSelection]);

    // Calculate which items to render (virtualization)
    const minRenderIndex = Math.max(0, centerIndex - VISIBLE_ITEMS_BUFFER);
    const maxRenderIndex = Math.min(items.length - 1, centerIndex + VISIBLE_ITEMS_BUFFER);

    const visibleItems = [];
    for (let i = minRenderIndex; i <= maxRenderIndex; i++) {
        visibleItems.push({ index: i, item: items[i] });
    }

    return (
        <div className="relative w-full h-full bg-[#F9F9F7] overflow-hidden">

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 1: Visual 3D Wheel (pointer-events: none)
                This layer displays the beautiful 3D cylinder effect
            ═══════════════════════════════════════════════════════════════ */}
            <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                style={{ perspective: "800px" }}
            >
                <div
                    className="relative w-full h-full"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    {visibleItems.map(({ index, item }) => {
                        // Calculate offset from center (in "item units", float)
                        const offset = (index * ITEM_HEIGHT - scrollTop) / ITEM_HEIGHT;
                        const absOffset = Math.abs(offset);

                        // 3D Cylinder Rotation
                        const rotateX = offset * -ROTATION_PER_ITEM;

                        // Visual effects based on distance from center
                        const opacity = Math.max(0.15, 1 - Math.pow(absOffset / 3.5, 2)); // Quadratic fade
                        const scale = Math.max(0.8, 1 - absOffset * 0.06);
                        const isActive = absOffset < 0.4;
                        const isSelected = selectedIndices.has(index);

                        return (
                            <div
                                key={`visual-${index}`}
                                className={cn(
                                    "absolute left-2 right-2 top-1/2 flex items-center gap-3 px-4 rounded-xl backface-hidden transition-colors duration-100",
                                    isActive ? "bg-white/60 shadow-sm" : "bg-transparent"
                                )}
                                style={{
                                    height: ITEM_HEIGHT,
                                    marginTop: -ITEM_HEIGHT / 2,
                                    transform: `
                                        rotateX(${rotateX}deg)
                                        translateZ(${CYLINDER_RADIUS}px)
                                        scale(${scale})
                                    `,
                                    transformOrigin: "center center",
                                    opacity,
                                    zIndex: Math.round(100 - absOffset * 10),
                                }}
                            >
                                {/* Checkbox Visual */}
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-150",
                                        isSelected
                                            ? "bg-braun-accent border-braun-accent text-white shadow-md"
                                            : "bg-white/80 border-gray-300"
                                    )}
                                >
                                    {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "font-semibold truncate transition-all duration-100",
                                        isActive
                                            ? "text-lg text-braun-text"
                                            : "text-base text-gray-500"
                                    )}>
                                        {item.front}
                                    </p>
                                    <p className={cn(
                                        "text-sm truncate transition-opacity duration-100",
                                        isActive ? "text-gray-500" : "text-gray-400"
                                    )}>
                                        {item.translation}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                Center Selection Highlight
                Warm glass panel with subtle orange accent border
            ═══════════════════════════════════════════════════════════════ */}
            <div
                className="absolute left-3 right-3 top-1/2 -translate-y-1/2 bg-white/40 border-y-2 border-braun-accent/25 backdrop-blur-sm rounded-2xl pointer-events-none z-10"
                style={{ height: ITEM_HEIGHT + 16 }}
            />

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 2: Interaction Layer (invisible scroller)
                Handles all touch/scroll interactions with CSS snap
            ═══════════════════════════════════════════════════════════════ */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto no-scrollbar z-20"
                style={{
                    scrollSnapType: isDragging ? "none" : "y mandatory",
                    scrollBehavior: isDragging ? "auto" : "smooth",
                }}
            >
                {/* Spacer to center the first item */}
                <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />

                {items.map((_, index) => (
                    <div
                        key={`scroll-${index}`}
                        className="w-full cursor-pointer"
                        style={{
                            height: ITEM_HEIGHT,
                            scrollSnapAlign: "center",
                        }}
                        onClick={() => handleItemClick(index)}
                    />
                ))}

                {/* Spacer to center the last item */}
                <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 3: Gradient Overlays
                Fade items at top and bottom for depth effect
            ═══════════════════════════════════════════════════════════════ */}
            <div
                className="absolute top-0 inset-x-0 h-28 pointer-events-none z-30"
                style={{
                    background: `linear-gradient(to bottom, 
                        rgba(249,249,247,1) 0%, 
                        rgba(249,249,247,0.8) 40%,
                        rgba(249,249,247,0) 100%)`
                }}
            />
            <div
                className="absolute bottom-0 inset-x-0 h-28 pointer-events-none z-30"
                style={{
                    background: `linear-gradient(to top, 
                        rgba(249,249,247,1) 0%, 
                        rgba(249,249,247,0.8) 40%,
                        rgba(249,249,247,0) 100%)`
                }}
            />
        </div>
    );
}
