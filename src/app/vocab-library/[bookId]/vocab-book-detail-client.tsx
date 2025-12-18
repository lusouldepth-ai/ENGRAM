'use client';

import { useState } from "react";
import { ArrowLeft, BookOpen, Play, List, ChevronRight } from "lucide-react";
import Link from "next/link";
import { startLearningBook } from "@/app/actions/vocab-actions";
import { useRouter } from "next/navigation";

interface VocabBook {
    id: string;
    book_id: string;
    title: string;
    word_count: number;
    cover_image: string | null;
    cefr_level: string | null;
    category: string | null;
    description: string | null;
}

interface VocabWord {
    id: string;
    word_rank: number;
    head_word: string;
    us_phonetic: string | null;
    translations: any[] | null;
}

interface Progress {
    current_word_rank: number;
    completed_count: number;
}

interface Props {
    book: VocabBook;
    words: VocabWord[];
    progress: Progress | null;
}

const CEFR_COLORS: Record<string, string> = {
    'A1': 'bg-green-100 text-green-700',
    'A2': 'bg-green-200 text-green-800',
    'B1': 'bg-blue-100 text-blue-700',
    'B2': 'bg-blue-200 text-blue-800',
    'C1': 'bg-purple-100 text-purple-700',
    'C2': 'bg-purple-200 text-purple-800',
};

export default function VocabBookDetailClient({ book, words, progress }: Props) {
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);

    const handleStart = async () => {
        setIsStarting(true);
        await startLearningBook(book.id);
        // TODO: 跳转到学习页面
        router.refresh();
        setIsStarting(false);
    };

    const progressPercent = progress
        ? Math.round((progress.completed_count / book.word_count) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 返回按钮 */}
                <Link
                    href="/vocab-library"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    返回词库
                </Link>

                {/* 词书信息卡片 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* 封面 */}
                        <div className="w-32 h-40 bg-gradient-to-br from-braun-accent/20 to-braun-accent/5 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-12 h-12 text-braun-accent/50" />
                        </div>

                        {/* 信息 */}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {book.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                                <span>{book.word_count} 词</span>
                                {book.cefr_level && (
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CEFR_COLORS[book.cefr_level]}`}>
                                        {book.cefr_level}
                                    </span>
                                )}
                                {book.category && (
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                        {book.category}
                                    </span>
                                )}
                            </div>
                            {book.description && (
                                <p className="text-gray-600 mb-6">
                                    {book.description}
                                </p>
                            )}

                            {/* 进度条 */}
                            {progress && (
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                                        <span>学习进度</span>
                                        <span>{progress.completed_count} / {book.word_count} ({progressPercent}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-braun-accent h-full rounded-full transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 操作按钮 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleStart}
                                    disabled={isStarting}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-braun-accent text-white font-medium hover:bg-braun-accent/90 transition-colors disabled:opacity-50"
                                >
                                    <Play className="w-5 h-5" />
                                    {progress ? '继续学习' : '开始学习'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 单词预览 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <List className="w-5 h-5 text-braun-accent" />
                        单词预览
                        <span className="text-sm font-normal text-gray-400">(前50个)</span>
                    </h2>

                    <div className="divide-y divide-gray-100">
                        {words.map((word, index) => {
                            const translation = word.translations?.[0];
                            return (
                                <div
                                    key={word.id}
                                    className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-400 w-8">
                                            {word.word_rank}
                                        </span>
                                        <div>
                                            <span className="font-medium text-gray-900">
                                                {word.head_word}
                                            </span>
                                            {word.us_phonetic && (
                                                <span className="text-sm text-gray-400 ml-2">
                                                    /{word.us_phonetic}/
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {translation && (
                                        <div className="text-sm text-gray-500 text-right max-w-[200px] truncate">
                                            {translation.pos && (
                                                <span className="text-gray-400 mr-1">
                                                    {translation.pos}.
                                                </span>
                                            )}
                                            {translation.tranCn}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {words.length >= 50 && (
                        <div className="text-center pt-4 border-t border-gray-100 mt-4">
                            <span className="text-sm text-gray-400">
                                还有 {book.word_count - 50} 个单词...
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
