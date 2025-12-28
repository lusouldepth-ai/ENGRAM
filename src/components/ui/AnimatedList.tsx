'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AnimatedItemProps {
    children: React.ReactNode;
    delay?: number;
    index: number;
    onMouseEnter: () => void;
    onClick: () => void;
}

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }: AnimatedItemProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5, once: false });

    return (
        <motion.div
            ref={ref}
            data-index={index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2, delay }}
            className="mb-2 cursor-pointer"
        >
            {children}
        </motion.div>
    );
};

export interface VocabItem {
    word: string;
    translation: string;
}

interface AnimatedListProps {
    items: VocabItem[];
    onItemSelect?: (item: VocabItem, index: number) => void;
    showGradients?: boolean;
    enableArrowNavigation?: boolean;
    className?: string;
    itemClassName?: string;
    displayScrollbar?: boolean;
    initialSelectedIndex?: number;
}

const AnimatedList = ({
    items,
    onItemSelect,
    showGradients = true,
    enableArrowNavigation = true,
    className = '',
    itemClassName = '',
    displayScrollbar = false,
    initialSelectedIndex = 0
}: AnimatedListProps) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
    const [keyboardNav, setKeyboardNav] = useState(false);
    const [topGradientOpacity, setTopGradientOpacity] = useState(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

    const handleItemMouseEnter = useCallback((index: number) => {
        setSelectedIndex(index);
    }, []);

    const handleItemClick = useCallback(
        (item: VocabItem, index: number) => {
            setSelectedIndex(index);
            if (onItemSelect) {
                onItemSelect(item, index);
            }
        },
        [onItemSelect]
    );

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const { scrollTop, scrollHeight, clientHeight } = target;
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
    }, []);

    useEffect(() => {
        if (!enableArrowNavigation) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
            } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < items.length) {
                    e.preventDefault();
                    if (onItemSelect) {
                        onItemSelect(items[selectedIndex], selectedIndex);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

    useEffect(() => {
        if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
        const container = listRef.current;
        const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
        if (selectedItem) {
            const extraMargin = 50;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;
            if (itemTop < containerScrollTop + extraMargin) {
                container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
            } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                container.scrollTo({
                    top: itemBottom - containerHeight + extraMargin,
                    behavior: 'smooth'
                });
            }
        }
        setKeyboardNav(false);
    }, [selectedIndex, keyboardNav]);

    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            <div
                ref={listRef}
                className={cn(
                    "w-full h-full overflow-y-auto p-4 scroll-smooth",
                    !displayScrollbar && "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                )}
                onScroll={handleScroll}
            >
                {items.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                        <AnimatedItem
                            key={index}
                            delay={0.05}
                            index={index}
                            onMouseEnter={() => handleItemMouseEnter(index)}
                            onClick={() => handleItemClick(item, index)}
                        >
                            <div className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-xl bg-transparent transition-all duration-200",
                                "hover:bg-white/60",
                                isSelected ? "bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" : "",
                                itemClassName
                            )}>
                                <div className={cn(
                                    "w-6 h-6 rounded-md border-2 border-[#E5E5E5] flex items-center justify-center shrink-0 transition-all duration-200",
                                    isSelected ? "bg-braun-accent border-braun-accent text-white" : ""
                                )}>
                                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={cn(
                                        "text-base font-semibold m-0 leading-snug truncate transition-colors duration-200",
                                        isSelected ? "text-[#1A1A1A]" : "text-gray-400"
                                    )}>
                                        {item.word}
                                    </p>
                                    <p className={cn(
                                        "text-[13px] m-0 mt-0.5 leading-tight truncate transition-colors duration-200",
                                        isSelected ? "text-gray-500" : "text-gray-400"
                                    )}>
                                        {item.translation}
                                    </p>
                                </div>
                            </div>
                        </AnimatedItem>
                    );
                })}
            </div>
            {showGradients && (
                <>
                    <div
                        className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10 transition-opacity duration-200"
                        style={{
                            background: 'linear-gradient(to bottom, #F9F9F7 0%, transparent 100%)',
                            opacity: topGradientOpacity
                        }}
                    />
                    <div
                        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10 transition-opacity duration-200"
                        style={{
                            background: 'linear-gradient(to top, #F9F9F7 0%, transparent 100%)',
                            opacity: bottomGradientOpacity
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default AnimatedList;
