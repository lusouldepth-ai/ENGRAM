"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useVelocity, animate } from "framer-motion";
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

// Procedural tick sound generator
const playTickSound = () => {
    if (typeof window === "undefined" || !window.AudioContext && !(window as any).webkitAudioContext) return;

    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);

        // Close context after a short delay to free resources
        setTimeout(() => ctx.close(), 100);
    } catch (e) {
        console.warn("AudioContext failed", e);
    }
};

const ITEM_HEIGHT = 70; // Height of each item in the picker
const VISIBLE_ITEMS = 5;

export function WheelPicker({ items, selectedIndex, onIndexChange, onToggleSelection, selectedIndices }: WheelPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({
        container: containerRef,
    });

    const lastTickIndex = useRef(selectedIndex);

    // Detect when the center item changes to play the tick sound
    useEffect(() => {
        const unsubscribe = scrollY.on("change", (latest) => {
            const index = Math.round(latest / ITEM_HEIGHT);
            if (index !== lastTickIndex.current && index >= 0 && index < items.length) {
                lastTickIndex.current = index;
                playTickSound();
                onIndexChange(index);
            }
        });
        return () => unsubscribe();
    }, [scrollY, items.length, onIndexChange]);

    const snapToItem = (index: number) => {
        if (!containerRef.current) return;
        animate(containerRef.current.scrollTop, index * ITEM_HEIGHT, {
            type: "spring",
            bounce: 0.2,
            duration: 0.6,
            onUpdate: (latest) => {
                if (containerRef.current) containerRef.current.scrollTop = latest;
            }
        });
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-start bg-[#F9F9F7] overflow-hidden">
            {/* Selection Highlight Overlays */}
            <div className="absolute top-1/2 left-0 right-0 h-[70px] -translate-y-1/2 pointer-events-none z-10">
                <div className="absolute top-0 left-4 right-4 h-px bg-gray-200" />
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200" />
            </div>

            {/* Wheel Container */}
            <div
                ref={containerRef}
                className="w-full h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory perspective-[1000px]"
                style={{
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                <div className="relative w-full flex flex-col items-center [transform-style:preserve-3d]">
                    {items.map((item, i) => {
                        return (
                            <WheelItem
                                key={i}
                                index={i}
                                item={item}
                                scrollY={scrollY}
                                isSelected={selectedIndices.has(i)}
                                isFocused={selectedIndex === i}
                                onToggle={() => onToggleSelection(i)}
                                onIndexChange={onIndexChange}
                                snapToItem={snapToItem}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function WheelItem({
    index,
    item,
    scrollY,
    isSelected,
    isFocused,
    onToggle,
    onIndexChange,
    snapToItem
}: {
    index: number;
    item: CardData;
    scrollY: any;
    isSelected: boolean;
    isFocused: boolean;
    onToggle: () => void;
    onIndexChange: (idx: number) => void;
    snapToItem: (idx: number) => void;
}) {
    const range = [(index - 2) * ITEM_HEIGHT, index * ITEM_HEIGHT, (index + 2) * ITEM_HEIGHT];

    // 3D Transforms
    const rotateX = useTransform(scrollY, range, [45, 0, -45]);
    const opacity = useTransform(scrollY, range, [0.3, 1, 0.3]);
    const scale = useTransform(scrollY, range, [0.85, 1, 0.85]);
    const z = useTransform(scrollY, range, [-100, 0, -100]);

    return (
        <motion.div
            style={{
                height: ITEM_HEIGHT,
                rotateX,
                opacity,
                scale,
                translateZ: z,
                transformStyle: "preserve-3d"
            }}
            onClick={() => {
                snapToItem(index);
            }}
            className={cn(
                "w-full flex items-center gap-4 px-8 cursor-pointer select-none snap-center transition-colors shrink-0",
                isFocused ? "text-braun-text" : "text-gray-400"
            )}
        >
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 border",
                    isSelected ? "bg-braun-accent border-braun-accent text-white" : "border-gray-200 bg-white"
                )}
            >
                {isSelected && <Check className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pointer-events-none">
                <h4 className="text-lg font-bold truncate leading-tight">{item.front}</h4>
                <p className="text-sm opacity-60 truncate">{item.translation}</p>
            </div>
        </motion.div>
    );
}
