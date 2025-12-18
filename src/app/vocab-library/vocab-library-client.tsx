'use client';

import { useState } from "react";
import { Book, BookOpen, GraduationCap, Briefcase, Plane, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";
import { startLearningBook } from "@/app/actions/vocab-actions";

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

interface LearningProgress {
    id: string;
    book_id: string;
    current_word_rank: number;
    completed_count: number;
    vocab_books: VocabBook;
}

interface Props {
    books: VocabBook[];
    learningProgress: LearningProgress[];
    recommendedBooks: VocabBook[];
    userLevel: string;
}

const CEFR_COLORS: Record<string, string> = {
    'A1': 'bg-green-100 text-green-700',
    'A2': 'bg-green-200 text-green-800',
    'B1': 'bg-blue-100 text-blue-700',
    'B2': 'bg-blue-200 text-blue-800',
    'C1': 'bg-purple-100 text-purple-700',
    'C2': 'bg-purple-200 text-purple-800',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    '四六级': <GraduationCap className="w-4 h-4" />,
    '考研': <GraduationCap className="w-4 h-4" />,
    '雅思': <Plane className="w-4 h-4" />,
    '托福': <Plane className="w-4 h-4" />,
    '职场': <Briefcase className="w-4 h-4" />,
};

export default function VocabLibraryClient({
    books,
    learningProgress,
    recommendedBooks,
    userLevel
}: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

    // 过滤词书
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = !selectedLevel || book.cefr_level === selectedLevel;
        return matchesSearch && matchesLevel;
    });

    // 正在学习的词书 IDs
    const learningBookIds = new Set(learningProgress.map(p => p.book_id));

    const handleStartLearning = async (bookId: string) => {
        await startLearningBook(bookId);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 页面标题 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">词库</h1>
                    <p className="text-gray-500">
                        当前等级: <span className={`px-2 py-0.5 rounded text-sm font-medium ${CEFR_COLORS[userLevel]}`}>{userLevel}</span>
                    </p>
                </div>

                {/* 正在学习的词书 */}
                {learningProgress.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-braun-accent" />
                            正在学习
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {learningProgress.map((progress) => (
                                <Link
                                    key={progress.id}
                                    href={`/vocab-library/${progress.book_id}`}
                                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-braun-accent transition-colors">
                                            {progress.vocab_books.title}
                                        </h3>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-braun-accent transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                                        <span>{progress.vocab_books.word_count} 词</span>
                                        {progress.vocab_books.cefr_level && (
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${CEFR_COLORS[progress.vocab_books.cefr_level]}`}>
                                                {progress.vocab_books.cefr_level}
                                            </span>
                                        )}
                                    </div>
                                    {/* 进度条 */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>进度</span>
                                            <span>{progress.completed_count} / {progress.vocab_books.word_count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-braun-accent h-full rounded-full transition-all"
                                                style={{
                                                    width: `${(progress.completed_count / progress.vocab_books.word_count) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* 搜索和筛选 */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜索词书..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-braun-accent/20 focus:border-braun-accent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedLevel(null)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedLevel ? 'bg-braun-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            全部
                        </button>
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedLevel === level ? 'bg-braun-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 全部词书 */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Book className="w-5 h-5 text-braun-accent" />
                        全部词书
                        <span className="text-sm font-normal text-gray-400">({filteredBooks.length})</span>
                    </h2>

                    {filteredBooks.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Book className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">暂无词书</p>
                            <p className="text-sm text-gray-400 mt-1">请联系管理员导入词库</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredBooks.map((book) => {
                                const isLearning = learningBookIds.has(book.id);
                                return (
                                    <div
                                        key={book.id}
                                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900">
                                                {book.title}
                                            </h3>
                                            {book.category && CATEGORY_ICONS[book.category] && (
                                                <span className="text-gray-400">
                                                    {CATEGORY_ICONS[book.category]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                                            <span>{book.word_count} 词</span>
                                            {book.cefr_level && (
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CEFR_COLORS[book.cefr_level]}`}>
                                                    {book.cefr_level}
                                                </span>
                                            )}
                                            {book.category && (
                                                <span className="text-gray-400">{book.category}</span>
                                            )}
                                        </div>
                                        {book.description && (
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                                {book.description}
                                            </p>
                                        )}
                                        {isLearning ? (
                                            <Link
                                                href={`/vocab-library/${book.id}`}
                                                className="block w-full text-center py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                                            >
                                                继续学习
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => handleStartLearning(book.id)}
                                                className="w-full py-2.5 rounded-lg bg-braun-accent text-white font-medium hover:bg-braun-accent/90 transition-colors"
                                            >
                                                开始学习
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
