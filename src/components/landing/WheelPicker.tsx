"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
    motion,
    useScroll,
    useTransform,
    MotionValue,
    useSpring,
    useMotionValueEvent
} from "framer-motion";
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
const ITEM_HEIGHT = 64; // Slightly taller for better touch target
const VISIBLE_ITEMS = 5; // Odd number works best
const PERSPECTIVE = 1000;
const WHEEL_RADIUS = 200; // Controls how "curved" the cylinder feels

// --- Audio Hook ---
function useWheelSound(selectedIndex: number, soundPath: string = "/sounds/tick.wav") {
    // Refs to manage audio context and throttling
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastPlayedIndex = useRef<number>(selectedIndex);
    const lastPlayTime = useRef<number>(0);
    const THROTTLE_MS = 60; // Adjust for natural feel

    // Preload audio buffer if possible (optional optimization) or just fetch on demand
    // For simplicity and robustness with changing files, we'll use a simple HTMLAudioElement approach first 
    // or Web Audio API if low latency is critical. 
    // Given the requirement for "Machine Gun" prevention, Web Audio API is better for latency.

    useEffect(() => {
        // Initialize AudioContext on first interaction if possible, 
        // but browsers block it until gesture. We'll handle it lazily.
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
        }
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const playClick = useCallback(() => {
        const now = Date.now();
        if (now - lastPlayTime.current < THROTTLE_MS) return;

        try {
            // Lazy init logic again if closed
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) audioContextRef.current = new AudioContextClass();
            }

            const ctx = audioContextRef.current;
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();

            // create a short high-frequency tick using oscillator for zero-latency fallback 
            // OR fetch the file. 
            // User specifically asked to use the file.

            // Let's use a simple HTML5 Audio object for the file playback which is easier to implement accurately for a specific file resource
            // but might have slight latency.
            // "Short crisp tick" from file.

            const audio = new Audio(soundPath);
            audio.volume = 0.4;
            audio.play().catch(e => {
                // Ignore autoplay errors
            });

            lastPlayTime.current = now;
        } catch (e) {
            console.error("Audio play error", e);
        }
    }, [soundPath]);

    useEffect(() => {
        if (selectedIndex !== lastPlayedIndex.current) {
            playClick();
            lastPlayedIndex.current = selectedIndex;
        }
    }, [selectedIndex, playClick]);
}


export function WheelPicker({
    items,
    selectedIndex,
    onIndexChange,
    onToggleSelection,
    selectedIndices
}: WheelPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);

    // Audio Feedback
    useWheelSound(selectedIndex, "/sounds/tick.wav");

    // Framer Motion Scroll Hook
    const { scrollY } = useScroll({
        container: containerRef,
    });

    // Detect Active Index based on Scroll Position
    // We update the parent state when scroll snapping settles or during scroll?
    // User wants sound *when passing*, so we need real-time index updates.
    useMotionValueEvent(scrollY, "change", (latestVal) => {
        const centerIndex = Math.round(latestVal / ITEM_HEIGHT);
        // Only trigger change if valid and different
        if (centerIndex >= 0 && centerIndex < items.length && centerIndex !== selectedIndex) {
            onIndexChange(centerIndex);
        }
    });

    // Initial Scroll Position
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount? Or if selectedIndex changes externally? 
    // If selectedIndex changes externally (e.g. initial load), we sync.
    // We need to be careful not to fight the user's scroll.
    useEffect(() => {
        if (!isScrollingRef.current && containerRef.current) {
            const currentScrollIndex = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
            if (currentScrollIndex !== selectedIndex) {
                containerRef.current.scrollTo({
                    top: selectedIndex * ITEM_HEIGHT,
                    behavior: "smooth"
                });
            }
        }
    }, [selectedIndex]);


    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#F9F9F7] overflow-hidden">
            {/* 
               SCROLL CONTAINER 
               This is the transparent interaction layer with precise scroll snap.
            */}
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar z-20"
                onScroll={() => { isScrollingRef.current = true; }}
                onPointerUp={() => {
                    // Reset scrolling lock after a delay to allow "smooth" external updates again?
                    // actually standard scroll events are fine.
                    setTimeout(() => { isScrollingRef.current = false; }, 500);
                }}
                style={{
                    scrollBehavior: 'smooth',
                }}
            >
                {/* Spacer Top */}
                <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />

                {/* Items for snapping target (Invisible touch targets) */}
                {items.map((_, i) => (
                    <div
                        key={i}
                        className="w-full snap-center"
                        style={{ height: ITEM_HEIGHT }}
                        onClick={() => {
                            // Allow click to snap
                            containerRef.current?.scrollTo({
                                top: i * ITEM_HEIGHT,
                                behavior: "smooth"
                            });
                        }}
                    />
                ))}

                {/* Spacer Bottom */}
                <div style={{ height: `calc(50% - ${ITEM_HEIGHT / 2}px)` }} />
            </div>


            {/* 
               VISUAL RENDERING LAYER (3D WHEEL)
               This listens to the scrollX/Y of the container but renders visually distinct.
               Pointer events are set to none so clicks pass through to the scroll container.
            */}
            <div
                className="relative w-full h-full pointer-events-none flex items-center justify-center"
                style={{
                    perspective: PERSPECTIVE,
                    transformStyle: "preserve-3d"
                }}
            >
                {/* Selection Highlight (Center Strip) */}
                <div
                    className="absolute z-0 w-full bg-white/40 border-y border-braun-accent/20 backdrop-blur-sm shadow-sm"
                    style={{ height: ITEM_HEIGHT + 16 }} // Slightly larger than item
                />

                <div className="relative w-full h-full [transform-style:preserve-3d]">
                    {items.map((item, i) => (
                        <Wheel3DItem
                            key={i}
                            index={i}
                            item={item}
                            scrollY={scrollY}
                            isSelected={selectedIndices.has(i)}
                            isFocused={selectedIndex === i}
                            totalCount={items.length}
                        />
                    ))}
                </div>
            </div>

            {/* Top/Bottom Fade Gradients */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#F9F9F7] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F9F9F7] to-transparent z-10 pointer-events-none" />
        </div>
    );
}


// --- 3D Item Component ---
function Wheel3DItem({
    index,
    item,
    scrollY,
    isSelected,
    isFocused,
    totalCount
}: {
    index: number;
    item: CardData;
    scrollY: MotionValue<number>;
    isSelected: boolean;
    isFocused: boolean;
    totalCount: number;
}) {
    // Determine the scroll position relative to THIS item
    // When scrollY is at index * ITEM_HEIGHT, the item is in the center.
    // 'offset' will be 0 at center, positive when item is above center, negative when below
    const rawOffset = useTransform(scrollY, (y) => (y - index * ITEM_HEIGHT) / ITEM_HEIGHT);

    // --- 3D Transformations for CONVEX (protruding) Wheel ---
    // At 0: RotateX = 0, Z = 0
    // At 1 (one item Down): RotateX = -20deg (tilting away up), Z = -depth
    // At -1 (one item Up): RotateX = 20deg (tilting away down), Z = -depth

    // RotateX:
    // If offset is positive (we have scrolled Past the item, item is "above"), 
    // we want visual top of wheel -> rotateX should be positive? 
    // Standard CSS rotateX(positive) moves top back. Correct.
    const rotateX = useTransform(rawOffset, (val) => {
        // Clamp to visible range optimizations
        if (Math.abs(val) > 4) return val * 20; // Optimization
        return val * 18; // 18 degrees per item unit
    });

    const z = useTransform(rawOffset, (val) => {
        // Circular path approximation: R * cos(theta) - R
        // simpler: just push back based on distance
        const absVal = Math.abs(val);
        return -1 * (absVal * absVal) * 8; // Quadratic falloff for depth
    });

    const opacity = useTransform(rawOffset, (val) => {
        return 1 - Math.pow(Math.abs(val) / 3.5, 1.5); // Smooth fade out
    });

    const scale = useTransform(rawOffset, (val) => {
        return 1 - Math.abs(val) * 0.05;
    });

    // Visibility optimization: hide if too far
    const display = useTransform(rawOffset, (val) => Math.abs(val) > 4.5 ? "none" : "flex");

    return (
        <motion.div
            className={cn(
                "absolute left-0 right-0 top-1/2 flex items-center px-8 gap-4",
                // Base colors
                isFocused ? "text-braun-text" : "text-gray-400"
            )}
            style={{
                height: ITEM_HEIGHT,
                marginTop: -ITEM_HEIGHT / 2, // Centering trick
                rotateX: rotateX,
                z: z, // Using 'z' instead of translateZ usually works in framer-motion recent versions specific shorthand
                scale: scale,
                opacity: opacity,
                display: display,
                transformStyle: "preserve-3d", // Critical for nested transforms
                transformOrigin: "50% 50% -200px", // Push pivot point back to create "Wheel Radius" effect **CRITICAL for Convex**
            }}
        >
            {/* Checkbox Indicator */}
            <div className={cn(
                "w-6 h-6 rounded-md border flex items-center justify-center transition-colors duration-200",
                isSelected
                    ? "bg-braun-accent border-braun-accent text-white"
                    : "bg-white border-gray-200"
            )}>
                {isSelected && <Check className="w-4 h-4" />}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold truncate leading-tight">
                    {item.front}
                </div>
                <div className="text-sm truncate opacity-80">
                    {item.translation}
                </div>
            </div>
        </motion.div>
    );
}
