'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Play, Trash2, Merge, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCard, deleteDeck } from "@/app/actions/card-actions";
import { getUserDecks, mergeDecks } from "@/app/actions/merge-decks";

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
    const [cards, setCards] = useState(deck.cards);
    const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
    const [isDeleting, startDelete] = useTransition();
    const [showDeleteDeckConfirm, setShowDeleteDeckConfirm] = useState(false);

    // 合并功能状态
    const [showMergePanel, setShowMergePanel] = useState(false);
    const [allDecks, setAllDecks] = useState<{ id: string; title: string; cardCount: number }[]>([]);
    const [selectedTargetDeck, setSelectedTargetDeck] = useState<string>('');
    const [isMerging, startMerge] = useTransition();
    const [mergeResult, setMergeResult] = useState<{ movedCards: number; duplicatesRemoved: number } | null>(null);

    // 加载所有 deck 列表
    useEffect(() => {
        async function loadDecks() {
            const result = await getUserDecks();
            if (result.success && result.decks) {
                // 过滤掉当前 deck
                setAllDecks(result.decks.filter(d => d.id !== deck.id));
            }
        }
        if (showMergePanel) {
            loadDecks();
        }
    }, [showMergePanel, deck.id]);

    const getCardStateLabel = (state: number, isMastered: boolean) => {
        if (isMastered) return { label: "Mastered", color: "bg-green-100 text-green-700" };
        if (state === 0) return { label: "New", color: "bg-blue-100 text-blue-700" };
        if (state === 1) return { label: "Learning", color: "bg-yellow-100 text-yellow-700" };
        return { label: "Review", color: "bg-purple-100 text-purple-700" };
    };

    const handleDeleteCard = (cardId: string) => {
        startDelete(async () => {
            const result = await deleteCard(cardId);
            if (result.success) {
                setCards(prev => prev.filter(c => c.id !== cardId));
                setDeletingCardId(null);
            } else {
                alert("删除失败: " + result.error);
            }
        });
    };

    const handleDeleteDeck = () => {
        startDelete(async () => {
            const result = await deleteDeck(deck.id);
            if (result.success) {
                router.push('/learning-center');
            } else {
                alert("删除失败: " + result.error);
            }
        });
    };

    const handleMerge = () => {
        if (!selectedTargetDeck) {
            alert('请选择目标卡片组');
            return;
        }

        startMerge(async () => {
            const result = await mergeDecks([deck.id], selectedTargetDeck);
            if (result.success) {
                setMergeResult({
                    movedCards: result.movedCards,
                    duplicatesRemoved: result.duplicatesRemoved
                });
                // 合并成功后跳转到目标 Deck
                setTimeout(() => {
                    router.push(`/learning-center/deck/${selectedTargetDeck}`);
                }, 1000);
            } else {
                alert("合并失败: " + result.error);
            }
        });
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowMergePanel(!showMergePanel)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                        <Merge className="w-4 h-4 mr-2" />
                        合并到...
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteDeckConfirm(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                    </Button>
                    <Button
                        onClick={() => router.push('/review')}
                        className="bg-braun-accent hover:bg-braun-accent/90 gap-2"
                    >
                        <Play className="w-4 h-4" />
                        复习
                    </Button>
                </div>
            </div>

            {/* Merge Panel */}
            {showMergePanel && (
                <Card className="p-6 bg-stone-50 border-stone-200">
                    {mergeResult ? (
                        <div className="text-center py-4">
                            <p className="text-green-700 font-medium mb-1">✅ 合并成功！</p>
                            <p className="text-sm text-gray-600">
                                移动了 {mergeResult.movedCards} 张卡片
                                {mergeResult.duplicatesRemoved > 0 && `，去除了 ${mergeResult.duplicatesRemoved} 个重复`}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="text-braun-text font-semibold mb-1">合并卡片组</h3>
                                <p className="text-sm text-gray-500">
                                    将 <span className="font-medium text-braun-text">"{deck.title}"</span> 中的 {cards.length} 张卡片移动到另一个卡片组。
                                </p>
                            </div>

                            <div className="flex gap-3 items-center">
                                <div className="flex-1 relative">
                                    <select
                                        value={selectedTargetDeck}
                                        onChange={(e) => setSelectedTargetDeck(e.target.value)}
                                        className="w-full h-10 px-3 pr-8 rounded-md border border-stone-200 bg-white text-sm text-braun-text focus:outline-none focus:ring-2 focus:ring-braun-accent/20 focus:border-braun-accent appearance-none"
                                        disabled={isMerging}
                                    >
                                        <option value="">选择目标卡片组...</option>
                                        {allDecks.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.title} ({d.cardCount} 张卡片)
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setShowMergePanel(false)}
                                    disabled={isMerging}
                                    className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200"
                                >
                                    取消
                                </Button>
                                <Button
                                    onClick={handleMerge}
                                    disabled={isMerging || !selectedTargetDeck}
                                    className="bg-braun-accent hover:bg-orange-700 text-white min-w-[100px]"
                                >
                                    {isMerging ? "合并中..." : "确认合并"}
                                </Button>
                            </div>

                            <div className="flex items-start gap-2 text-xs text-braun-accent/80 bg-orange-50 p-3 rounded-md border border-orange-100">
                                <div className="mt-0.5">⚠️</div>
                                <p>合并后当前卡片组将被删除。如果目标卡片组中已存在相同的单词，将自动去重。</p>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Delete Deck Confirmation */}
            {showDeleteDeckConfirm && (
                <Card className="p-4 bg-red-50 border-red-200">
                    <p className="text-red-800 mb-3">
                        确定要删除卡片组 "{deck.title}" 吗？这将删除其中的所有 {cards.length} 张卡片，此操作不可撤销。
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteDeckConfirm(false)}
                            disabled={isDeleting}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteDeck}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "删除中..." : "确认删除"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Stats Bar */}
            <Card className="p-4 bg-white border-gray-200">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{cards.length}</span>
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
            {cards.length === 0 ? (
                <Card className="p-12 bg-white border-dashed border-2 border-gray-200 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Cards in This Deck</h3>
                    <p className="text-gray-500">This deck is empty. Generate some cards to get started!</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card: any) => {
                        const stateInfo = getCardStateLabel(card.state, card.is_mastered);
                        const isConfirmingDelete = deletingCardId === card.id;

                        return (
                            <Card key={card.id} className="p-5 bg-white border-gray-200 hover:shadow-md transition-shadow relative group">
                                {/* Delete Button - Show on hover */}
                                <button
                                    onClick={() => setDeletingCardId(card.id)}
                                    className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                    title="删除卡片"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Delete Confirmation */}
                                {isConfirmingDelete && (
                                    <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center p-4 z-10">
                                        <p className="text-sm text-gray-600 mb-3 text-center">确定删除 "{card.front}" 吗？</p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeletingCardId(null)}
                                                disabled={isDeleting}
                                            >
                                                取消
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteCard(card.id)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? "..." : "删除"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

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

