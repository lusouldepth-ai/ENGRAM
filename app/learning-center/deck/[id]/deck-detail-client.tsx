'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DeckDetailClientProps {
    deck: {
        id: string;
        title: string;
        description: string | null;
        created_at: string;
        cards: any[];
    };
}

export default function DeckDetailClient({ deck }: DeckDetailClientProps) {
    const router = useRouter();

    const getCardStateLabel = (state: number, isMastered: boolean) => {
        if (isMastered) return { label: "Mastered", color: "bg-green-100 text-green-700" };
        if (state === 0) return { label: "New", color: "bg-blue-100 text-blue-700" };
        if (state === 1) return { label: "Learning", color: "bg-yellow-100 text-yellow-700" };
        return { label: "Review", color: "bg-purple-100 text-purple-700" };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/learning-center">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-4xl font-bold text-braun-text mb-1">{deck.title}</h1>
                    {deck.description && (
                        <p className="text-gray-500">{deck.description}</p>
                    )}
                </div>
                <Button
                    onClick={() => router.push('/review')}
                    className="bg-braun-accent hover:bg-braun-accent/90 gap-2"
                >
                    <Play className="w-4 h-4" />
                    Start Review
                </Button>
            </div>

            {/* Stats Bar */}
            <Card className="p-4 bg-white border-gray-200">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{deck.cards.length}</span>
                        <span className="text-gray-500">cards</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Created</span>
                        <span className="font-semibold">
                            {new Date(deck.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Cards Grid */}
            {deck.cards.length === 0 ? (
                <Card className="p-12 bg-white border-dashed border-2 border-gray-200 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Cards in This Deck</h3>
                    <p className="text-gray-500">This deck is empty. Generate some cards to get started!</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deck.cards.map((card: any) => {
                        const stateInfo = getCardStateLabel(card.state, card.is_mastered);
                        return (
                            <Card key={card.id} className="p-5 bg-white border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-2xl font-bold text-braun-text">{card.front}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${stateInfo.color}`}>
                                        {stateInfo.label}
                                    </span>
                                </div>

                                {card.phonetic && (
                                    <p className="text-sm text-gray-400 font-mono mb-2">{card.phonetic}</p>
                                )}

                                <div className="space-y-2 text-sm">
                                    {card.translation && (
                                        <p className="text-lg font-medium text-braun-text">{card.translation}</p>
                                    )}

                                    {card.definition && (
                                        <p className="text-gray-600 line-clamp-2">{card.definition}</p>
                                    )}

                                    {card.short_usage && (
                                        <p className="text-braun-accent font-semibold italic">"{card.short_usage}"</p>
                                    )}
                                </div>

                                {card.due && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                                        Next review: {new Date(card.due) < new Date() ? 'Now' : new Date(card.due).toLocaleDateString()}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
