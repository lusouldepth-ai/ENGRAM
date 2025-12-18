'use client';

import { useState } from "react";
import { Database } from "@/lib/supabase/types";
import { Search, Filter, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/contexts/LanguageContext";

type Card = Database["public"]["Tables"]["cards"]["Row"];

interface VocabularyListProps {
    cards: Card[];
}

export function VocabularyList({ cards }: VocabularyListProps) {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'all' | 'learning' | 'mastered'>('all');
    const [search, setSearch] = useState('');

    const filteredCards = cards.filter(card => {
        const matchesSearch = (card.front || '').toLowerCase().includes(search.toLowerCase()) ||
            (card.definition || '').toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'learning') return (card.state || 0) <= 1;
        if (filter === 'mastered') return (card.state || 0) > 1;
        return true;
    });

    return (
        <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-braun-accent" />
                        {t('vocab.title')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {cards.length} {t('vocab.collected')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('vocab.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-1 focus:ring-braun-accent outline-none w-48"
                        />
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-full">
                        {(['all', 'learning', 'mastered'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all",
                                    filter === f ? "bg-white shadow-sm text-braun-text" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {t(`vocab.filter.${f}`)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
                {filteredCards.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p>{t('vocab.noWords')}</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-gray-400 font-medium sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">{t('vocab.word')}</th>
                                <th className="px-6 py-3 font-medium">{t('vocab.translation')}</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">{t('vocab.status')}</th>
                                <th className="px-6 py-3 font-medium hidden md:table-cell">{t('vocab.nextReview')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCards.map((card) => (
                                <tr key={card.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#1A1A1A]">{card.front}</div>
                                        <div className="text-xs text-gray-400 font-mono">{card.phonetic}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="line-clamp-1">{card.translation || card.definition}</div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <StatusBadge state={card.state || 0} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs hidden md:table-cell">
                                        {card.due ? new Date(card.due).toLocaleDateString() : t('vocab.status.new')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ state }: { state: number }) {
    const { t } = useLanguage();
    if (state === 0) return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('vocab.status.new')}</span>;
    if (state <= 3) return <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('vocab.status.learning')}</span>;
    return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{t('vocab.status.mastered')}</span>;
}
