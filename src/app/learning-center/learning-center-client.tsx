'use client';

import { useState, useTransition, useEffect } from "react";
import { LearningStats, updateDailyGoal } from "@/app/actions/learning-stats";
import { migrateToVocabularyBook, ensureMistakeBook } from "@/app/actions/deck-migration";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LearningHeatmap } from "@/components/dashboard/LearningHeatmap";
import { TrendingUp, Target, Flame, BookOpen, Settings, ChevronRight, BookMarked, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LearningCenterClientProps {
    stats: LearningStats;
    decks: any[];
    yearlyActivity: { date: string; count: number }[];
}

export default function LearningCenterClient({ stats, decks, yearlyActivity }: LearningCenterClientProps) {
    const [dailyGoal, setDailyGoal] = useState(stats.todayTarget);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [migrationDone, setMigrationDone] = useState(false);
    const router = useRouter();

    // 自动运行迁移：将旧 deck 合并到"我的生词本"
    useEffect(() => {
        async function runMigration() {
            const result = await migrateToVocabularyBook();
            if (result.success && (result.migratedCards > 0 || result.deletedDecks > 0)) {
                console.log(`📚 [Migration] Migrated ${result.migratedCards} cards, deleted ${result.deletedDecks} old decks`);
                setMigrationDone(true);
                router.refresh();
            }
            // 确保错词本存在
            await ensureMistakeBook();
        }
        runMigration();
    }, [router]);

    const handleUpdateGoal = () => {
        startTransition(async () => {
            const result = await updateDailyGoal(dailyGoal);
            if (result.success) {
                setIsEditingGoal(false);
                router.refresh();
            } else {
                alert(result.error || "Failed to update goal");
            }
        });
    };

    const progressPercentage = Math.min(100, (stats.todayReviewed / stats.todayTarget) * 100);

    return (
        <div className="space-y-8">
            {/* Statistics Grid - 3 columns since heatmap now has trend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Today's Progress */}
                <Card className="p-6 bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Progress</h3>
                        <Target className="w-5 h-5 text-braun-accent" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-braun-text">{stats.todayReviewed}</span>
                            <span className="text-lg text-gray-400">/ {stats.todayTarget}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-braun-accent h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        {!isEditingGoal ? (
                            <button
                                onClick={() => setIsEditingGoal(true)}
                                className="text-xs text-gray-500 hover:text-braun-accent transition-colors flex items-center gap-1"
                            >
                                <Settings className="w-3 h-3" />
                                Adjust Goal
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={dailyGoal}
                                    onChange={(e) => setDailyGoal(parseInt(e.target.value) || 5)}
                                    className="h-8 text-sm"
                                    min={1}
                                    max={100}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleUpdateGoal}
                                    disabled={isPending}
                                    className="h-8 bg-braun-accent hover:bg-braun-accent/90"
                                >
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Total Vocabulary */}
                <Card className="p-6 bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Vocabulary</h3>
                        <BookOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl font-bold text-braun-text">{stats.totalCards}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {stats.masteredCards} Mastered
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                {stats.learningCards} Learning
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Streak Days */}
                <Card className="p-6 bg-white border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Streak</h3>
                        <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-braun-text">{stats.streakDays}</span>
                            <span className="text-lg text-gray-400">days</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {stats.streakDays > 0 ? "Keep it up! 🔥" : "Start your streak today!"}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Learning Activity Heatmap - 关联今日进度和连续天数 */}
            <div className="mt-6">
                <LearningHeatmap
                    activityData={yearlyActivity}
                    todayProgress={{ reviewed: stats.todayReviewed, target: stats.todayTarget }}
                    streakDays={stats.streakDays}
                />
            </div>

            {/* Decks Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-braun-text">My Decks</h2>
                    <span className="text-sm text-gray-500">{stats.totalDecks} total</span>
                </div>

                {decks.length === 0 ? (
                    <Card className="p-12 bg-white border-dashed border-2 border-gray-200 text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Decks Yet</h3>
                        <p className="text-gray-500 mb-6">Start by generating some vocabulary cards on the dashboard!</p>
                        <Link href="/dashboard">
                            <Button className="bg-braun-accent hover:bg-braun-accent/90">
                                Go to Dashboard
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map((deck: any) => (
                            <Link key={deck.id} href={`/learning-center/deck/${deck.id}`}>
                                <Card className="p-6 bg-white border-gray-200 hover:shadow-lg hover:border-braun-accent/50 transition-all cursor-pointer group">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-braun-text group-hover:text-braun-accent transition-colors line-clamp-1">
                                            {deck.title}
                                        </h3>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-braun-accent transition-colors flex-shrink-0" />
                                    </div>
                                    {deck.description && (
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{deck.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {deck.cards?.[0]?.count || 0} cards
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span>
                                            {new Date(deck.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
