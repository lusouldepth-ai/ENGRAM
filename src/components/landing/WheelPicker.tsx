"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, useMotionValue, useSpring, animate, useTransform } from "framer-motion";
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

// Constants for the wheel picker
const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 7;
const WHEEL_RADIUS = (ITEM_HEIGHT * VISIBLE_COUNT) / Math.PI;

// Throttled tick sound player using Web Audio API
const createTickPlayer = () => {
    let lastPlayTime = 0;
    const THROTTLE_MS = 50; // Minimum 50ms between ticks
    let audioContext: AudioContext | null = null;

    return () => {
        if (typeof window === "undefined") return;

        const now = Date.now();
        if (now - lastPlayTime < THROTTLE_MS) return;
        lastPlayTime = now;

        try {
            // Reuse or create AudioContext
            if (!audioContext || audioContext.state === "closed") {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContextClass) return;
                audioContext = new AudioContextClass();
            }

            // Resume if suspended (required for some browsers)
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            const ctx = audioContext;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Crisp, short tick sound like iOS picker
            osc.type = "sine";
            osc.frequency.setValueAtTime(1800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.03);
        } catch (e) {
            console.warn("Tick sound failed:", e);
        }
    };
};

// File-based tick sound player (for custom tick.mp3)
const createFileTickPlayer = (audioPath: string = "/sounds/tick.mp3") => {
    let lastPlayTime = 0;
    const THROTTLE_MS = 50;
    let audioElement: HTMLAudioElement | null = null;

    return () => {
        if (typeof window === "undefined") return;

        const now = Date.now();
        if (now - lastPlayTime < THROTTLE_MS) return;
        lastPlayTime = now;

        try {
            if (!audioElement) {
                audioElement = new Audio(audioPath);
                audioElement.volume = 0.3;
            }
            audioElement.currentTime = 0;
            audioElement.play().catch(() => { });
        } catch (e) {
            console.warn("Audio playback failed:", e);
        }
    };
};

// Use Web Audio API by default (no external file needed)
const playTickSound = createTickPlayer();

export function WheelPicker({
    items,
    selectedIndex,
    onIndexChange,
    onToggleSelection,
    selectedIndices
}: WheelPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastY = useRef(0);
    const velocity = useRef(0);
    const animationFrame = useRef<number | null>(null);
    const lastTickIndex = useRef(selectedIndex);

    // Motion value for smooth scroll position
    const scrollOffset = useMotionValue(selectedIndex * ITEM_HEIGHT);
    const springOffset = useSpring(scrollOffset, {
        stiffness: 300,
        damping: 30,
        mass: 0.8
    });

    // Calculate the centered index from scroll offset
    const getCurrentIndex = useCallback((offset: number) => {
        return Math.round(offset / ITEM_HEIGHT);
    }, []);

    // Clamp index to valid range
    const clampIndex = useCallback((index: number) => {
        return Math.max(0, Math.min(items.length - 1, index));
    }, [items.length]);

    // Snap to a specific index with animation
    const snapToIndex = useCallback((index: number) => {
        const clampedIndex = clampIndex(index);
        const targetOffset = clampedIndex * ITEM_HEIGHT;

        animate(scrollOffset, targetOffset, {
            type: "spring",
            stiffness: 400,
            damping: 35,
            onComplete: () => {
                if (clampedIndex !== selectedIndex) {
                    onIndexChange(clampedIndex);
                }
            }
        });
    }, [clampIndex, scrollOffset, selectedIndex, onIndexChange]);

    // Handle tick sound and index change
    useEffect(() => {
        const unsubscribe = springOffset.on("change", (latest) => {
            const currentIdx = getCurrentIndex(latest);
            const clampedIdx = clampIndex(currentIdx);

            if (clampedIdx !== lastTickIndex.current) {
                lastTickIndex.current = clampedIdx;
                playTickSound();
            }
        });
        return () => unsubscribe();
    }, [springOffset, getCurrentIndex, clampIndex]);

    // Handle wheel scroll
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();

        const delta = e.deltaY;
        const currentOffset = scrollOffset.get();
        const newOffset = currentOffset + delta * 0.5;

        // Clamp the new offset
        const maxOffset = (items.length - 1) * ITEM_HEIGHT;
        const clampedOffset = Math.max(0, Math.min(maxOffset, newOffset));

        scrollOffset.set(clampedOffset);

        // Debounced snap after wheel stops
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }

        animationFrame.current = requestAnimationFrame(() => {
            setTimeout(() => {
                const finalIndex = getCurrentIndex(scrollOffset.get());
                snapToIndex(finalIndex);
            }, 150);
        });
    }, [scrollOffset, items.length, getCurrentIndex, snapToIndex]);

    // Handle touch/mouse drag
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        isDragging.current = true;
        lastY.current = e.clientY;
        velocity.current = 0;

        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const deltaY = lastY.current - e.clientY;
        velocity.current = deltaY;
        lastY.current = e.clientY;

        const currentOffset = scrollOffset.get();
        const newOffset = currentOffset + deltaY;

        // Apply resistance at boundaries
        const maxOffset = (items.length - 1) * ITEM_HEIGHT;
        let clampedOffset = newOffset;

        if (newOffset < 0) {
            clampedOffset = newOffset * 0.3; // Rubber band effect
        } else if (newOffset > maxOffset) {
            clampedOffset = maxOffset + (newOffset - maxOffset) * 0.3;
        }

        scrollOffset.set(clampedOffset);
    }, [scrollOffset, items.length]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;

        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        // Apply inertia based on velocity
        const currentOffset = scrollOffset.get();
        const inertiaOffset = currentOffset + velocity.current * 8;
        const targetIndex = getCurrentIndex(inertiaOffset);

        snapToIndex(targetIndex);
    }, [scrollOffset, getCurrentIndex, snapToIndex]);

    // Add wheel event listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    // Initialize scroll position
    useEffect(() => {
        scrollOffset.set(selectedIndex * ITEM_HEIGHT);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex flex-col items-center justify-center bg-[#F9F9F7] overflow-hidden select-none touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Gradient overlays for depth */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F9F9F7] to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F9F9F7] to-transparent pointer-events-none z-20" />

            {/* Selection indicator */}
            <div className="absolute top-1/2 left-4 right-4 h-[56px] -translate-y-1/2 pointer-events-none z-10">
                <div className="w-full h-full rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm" />
            </div>

            {/* Wheel items */}
            <div
                className="relative w-full"
                style={{
                    height: VISIBLE_COUNT * ITEM_HEIGHT,
                    perspective: "1000px",
                    perspectiveOrigin: "center center"
                }}
            >
                {items.map((item, i) => (
                    <WheelItem
                        key={i}
                        index={i}
                        item={item}
                        scrollOffset={springOffset}
                        totalItems={items.length}
                        isSelected={selectedIndices.has(i)}
                        isFocused={selectedIndex === i}
                        onToggle={() => onToggleSelection(i)}
                        onTap={() => snapToIndex(i)}
                    />
                ))}
            </div>
        </div>
    );
}

interface WheelItemProps {
    index: number;
    item: CardData;
    scrollOffset: any;
    totalItems: number;
    isSelected: boolean;
    isFocused: boolean;
    onToggle: () => void;
    onTap: () => void;
}

function WheelItem({
    index,
    item,
    scrollOffset,
    totalItems,
    isSelected,
    isFocused,
    onToggle,
    onTap
}: WheelItemProps) {
    // Calculate the visual offset from center
    const itemOffset = useTransform(scrollOffset, (offset: number) => {
        const centerOffset = offset - (index * ITEM_HEIGHT);
        return -centerOffset; // Negative because we're measuring from item to center
    });

    // 3D transforms for convex wheel effect (like iOS UIPickerView)
    // Items above center rotate backward (positive X), items below rotate forward (negative X)
    const rotateX = useTransform(itemOffset, (offset: number) => {
        const normalizedOffset = offset / ITEM_HEIGHT;
        // Positive angle for items above, negative for below - creates CONVEX effect
        const angle = normalizedOffset * -25;
        return Math.max(-75, Math.min(75, angle));
    });

    // Y position follows a circular arc
    const y = useTransform(itemOffset, (offset: number) => {
        const normalizedOffset = offset / ITEM_HEIGHT;
        // Center position plus arc displacement
        const centerY = (VISIBLE_COUNT * ITEM_HEIGHT) / 2 - ITEM_HEIGHT / 2;
        const arcY = Math.sin(normalizedOffset * 0.3) * WHEEL_RADIUS * 0.15;
        return centerY + offset + arcY;
    });

    // Z depth - center item is closest, items curve away
    const z = useTransform(itemOffset, (offset: number) => {
        const normalizedOffset = Math.abs(offset / ITEM_HEIGHT);
        // Convex: center protrudes forward, edges recede
        const depth = -normalizedOffset * normalizedOffset * 8;
        return Math.max(-100, depth);
    });

    // Opacity fades for distant items
    const opacity = useTransform(itemOffset, (offset: number) => {
        const normalizedOffset = Math.abs(offset / ITEM_HEIGHT);
        return Math.max(0.2, 1 - normalizedOffset * 0.25);
    });

    // Scale slightly smaller for distant items
    const scale = useTransform(itemOffset, (offset: number) => {
        const normalizedOffset = Math.abs(offset / ITEM_HEIGHT);
        return Math.max(0.8, 1 - normalizedOffset * 0.05);
    });

    return (
        <motion.div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                y,
                rotateX,
                z,
                opacity,
                scale,
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                backfaceVisibility: "hidden"
            }}
            onClick={(e) => {
                e.stopPropagation();
                onTap();
            }}
            className={cn(
                "flex items-center gap-3 px-6 cursor-pointer",
                isFocused ? "text-braun-text" : "text-gray-400"
            )}
        >
            {/* Checkbox */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 border-2",
                    isSelected
                        ? "bg-braun-accent border-braun-accent text-white shadow-md"
                        : "border-gray-300 bg-white/80 hover:border-gray-400"
                )}
            >
                {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pointer-events-none">
                <h4 className={cn(
                    "text-base font-semibold truncate leading-tight transition-colors",
                    isFocused ? "text-braun-text" : "text-gray-500"
                )}>
                    {item.front}
                </h4>
                <p className={cn(
                    "text-sm truncate transition-colors",
                    isFocused ? "text-gray-600" : "text-gray-400"
                )}>
                    {item.translation}
                </p>
            </div>
        </motion.div>
    );
}
