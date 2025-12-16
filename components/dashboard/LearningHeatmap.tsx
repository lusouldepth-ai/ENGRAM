'use client';

import { useMemo, useState } from 'react';

interface ActivityDay {
    date: string;
    count: number;
}

interface LearningHeatmapProps {
    activityData: ActivityDay[];
    todayProgress?: { reviewed: number; target: number };
    streakDays?: number;
}

type TimePeriod = '7days' | '30days' | '90days';

/**
 * 增强版学习活动热力图
 * - 点击某天显示详情
 * - 下方显示时间段趋势图
 * - 橙色主题配色
 * - 与上方统计卡片数据关联
 */
export function LearningHeatmap({ activityData, todayProgress, streakDays }: LearningHeatmapProps) {
    // 默认选中今天
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');

    // 创建日期到计数的映射
    const countMap = useMemo(() => {
        const map = new Map<string, number>();
        activityData.forEach(day => {
            map.set(day.date, day.count);
        });
        return map;
    }, [activityData]);

    // 生成过去一年的日期网格
    const { weeks, months } = useMemo(() => {
        const today = new Date();
        const weeks: { date: Date; dateStr: string; count: number }[][] = [];
        const months: { name: string; col: number }[] = [];

        // 从一年前开始
        const startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        let currentMonth = -1;
        let currentDate = new Date(startDate);

        for (let week = 0; week < 53; week++) {
            const weekData: { date: Date; dateStr: string; count: number }[] = [];

            for (let day = 0; day < 7; day++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const count = countMap.get(dateStr) || 0;

                if (currentDate.getMonth() !== currentMonth && day === 0) {
                    currentMonth = currentDate.getMonth();
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    months.push({ name: monthNames[currentMonth], col: week });
                }

                weekData.push({
                    date: new Date(currentDate),
                    dateStr,
                    count
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            weeks.push(weekData);
        }

        return { weeks, months };
    }, [countMap]);

    // 获取选中日期的数据
    const selectedDayData = useMemo(() => {
        if (!selectedDate) return null;
        const count = countMap.get(selectedDate) || 0;
        const date = new Date(selectedDate);
        return {
            date,
            count,
            formattedDate: date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            })
        };
    }, [selectedDate, countMap]);

    // 获取趋势数据
    const trendData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let days = 7;
        if (timePeriod === '30days') days = 30;
        else if (timePeriod === '90days') days = 90;

        const data: { label: string; count: number; date: string }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = countMap.get(dateStr) || 0;

            let label = '';
            if (days <= 7) {
                label = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
            } else if (days <= 30) {
                label = `${date.getMonth() + 1}/${date.getDate()}`;
            } else {
                // 90 天只显示部分标签
                if (i % 7 === 0 || i === 0) {
                    label = `${date.getMonth() + 1}/${date.getDate()}`;
                }
            }

            data.push({ label, count, date: dateStr });
        }

        return data;
    }, [timePeriod, countMap]);

    const maxTrendCount = Math.max(...trendData.map(d => d.count), 1);
    const totalInPeriod = trendData.reduce((sum, d) => sum + d.count, 0);
    const avgPerDay = (totalInPeriod / trendData.length).toFixed(1);

    // 橙色主题配色（匹配 braun-accent）
    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 hover:bg-gray-200';
        if (count <= 2) return 'bg-orange-200 hover:bg-orange-300';
        if (count <= 5) return 'bg-orange-300 hover:bg-orange-400';
        if (count <= 10) return 'bg-orange-400 hover:bg-orange-500';
        return 'bg-orange-500 hover:bg-orange-600';
    };

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex gap-6">
                {/* 左侧：热力图 + 趋势 */}
                <div className="flex-1 min-w-0">
                    {/* 热力图 */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[650px]">
                            {/* 月份标签 */}
                            <div className="flex text-xs text-gray-400 mb-1">
                                <div className="w-8" />
                                <div className="flex-1 relative h-4">
                                    {months.map((month, i) => (
                                        <span
                                            key={i}
                                            className="absolute"
                                            style={{ left: `${(month.col / 53) * 100}%` }}
                                        >
                                            {month.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 热力图主体 */}
                            <div className="flex">
                                <div className="flex flex-col justify-around text-xs text-gray-400 w-8 pr-2">
                                    {dayLabels.map((label, i) => (
                                        <span key={i} className="h-3 leading-3">{label}</span>
                                    ))}
                                </div>

                                <div className="flex gap-[3px]">
                                    {weeks.map((week, weekIndex) => (
                                        <div key={weekIndex} className="flex flex-col gap-[3px]">
                                            {week.map((day, dayIndex) => {
                                                const isSelected = selectedDate === day.dateStr;
                                                const isFuture = day.date > new Date();

                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        onClick={() => !isFuture && setSelectedDate(day.dateStr)}
                                                        className={`w-3 h-3 rounded-sm transition-all cursor-pointer
                                                            ${isFuture ? 'bg-gray-50 cursor-default' : getColor(day.count)}
                                                            ${isSelected ? 'ring-2 ring-orange-600 ring-offset-1' : ''}
                                                        `}
                                                        title={`${day.dateStr}: ${day.count} 次学习`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 图例 */}
                            <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-400">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-sm bg-gray-100" />
                                    <div className="w-3 h-3 rounded-sm bg-orange-200" />
                                    <div className="w-3 h-3 rounded-sm bg-orange-300" />
                                    <div className="w-3 h-3 rounded-sm bg-orange-400" />
                                    <div className="w-3 h-3 rounded-sm bg-orange-500" />
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>

                    {/* 分隔线 */}
                    <div className="border-t border-gray-100 my-4" />

                    {/* 趋势部分 */}
                    <div className="flex items-center gap-6">
                        {/* 左侧：统计摘要 */}
                        <div className="flex-shrink-0 w-32">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">趋势</h3>
                                <div className="flex gap-0.5 bg-gray-100 rounded p-0.5">
                                    {[
                                        { key: '7days', label: '7d' },
                                        { key: '30days', label: '30d' },
                                        { key: '90days', label: '90d' },
                                    ].map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setTimePeriod(key as TimePeriod)}
                                            className={`px-2 py-0.5 text-[10px] rounded transition-all ${timePeriod === key
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-gray-400">总计</p>
                                    <p className="text-lg font-bold text-braun-text">{totalInPeriod}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                    <p className="text-[10px] text-gray-400">日均</p>
                                    <p className="text-lg font-bold text-braun-text">{avgPerDay}</p>
                                </div>
                            </div>
                        </div>

                        {/* 右侧：趋势柱状图 */}
                        <div className="flex-1 h-16 flex items-end gap-0.5">
                            {trendData.map((day, idx) => {
                                const heightPercent = (day.count / maxTrendCount) * 100;
                                const isToday = day.date === todayStr;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center">
                                        <div className="w-full flex items-end justify-center h-12">
                                            <div
                                                className={`w-full rounded-t transition-all cursor-default ${isToday ? 'bg-orange-500' : 'bg-orange-300 hover:bg-orange-400'}`}
                                                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                                title={`${day.date}: ${day.count} 次`}
                                            />
                                        </div>
                                        {day.label && (
                                            <span className={`text-[9px] mt-0.5 ${isToday ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                                                {day.label}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 右侧：选中日期详情 */}
                <div className="w-44 flex-shrink-0 border-l border-gray-100 pl-4">
                    {selectedDayData ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">选中日期</p>
                                <p className="text-sm font-medium text-gray-700">{selectedDayData.formattedDate}</p>
                            </div>

                            {/* 如果是今天且有 todayProgress 数据，显示实时进度 */}
                            {selectedDate === todayStr && todayProgress ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">今日进度</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-braun-accent">{todayProgress.reviewed}</span>
                                            <span className="text-sm text-gray-400">/ {todayProgress.target}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-braun-accent h-full rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (todayProgress.reviewed / todayProgress.target) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    {streakDays !== undefined && (
                                        <div className="bg-orange-50 rounded-lg p-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🔥</span>
                                                <div>
                                                    <p className="text-xs text-gray-500">连续学习</p>
                                                    <p className="text-lg font-bold text-orange-600">{streakDays} 天</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">学习次数</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold text-braun-accent">{selectedDayData.count}</span>
                                            <span className="text-sm text-gray-400 pb-0.5">次</span>
                                        </div>
                                    </div>
                                    {/* 前后对比柱状图 */}
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">前后3天</p>
                                        <div className="h-16 flex items-end gap-0.5">
                                            {[...Array(7)].map((_, i) => {
                                                const d = new Date(selectedDayData.date);
                                                d.setDate(d.getDate() - 3 + i);
                                                const dateStr = d.toISOString().split('T')[0];
                                                const count = countMap.get(dateStr) || 0;
                                                const maxInRange = Math.max(selectedDayData.count, ...[-3, -2, -1, 1, 2, 3].map(offset => {
                                                    const dd = new Date(selectedDayData.date);
                                                    dd.setDate(dd.getDate() + offset);
                                                    return countMap.get(dd.toISOString().split('T')[0]) || 0;
                                                }));
                                                const height = maxInRange > 0 ? Math.max(8, (count / maxInRange) * 100) : 8;
                                                const isCenter = i === 3;
                                                const dayLabel = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];

                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center">
                                                        <div className="w-full flex items-end justify-center h-10">
                                                            <div
                                                                className={`w-full rounded-t transition-all ${isCenter ? 'bg-orange-500' : 'bg-orange-200'}`}
                                                                style={{ height: `${height}%` }}
                                                                title={`${dateStr}: ${count}`}
                                                            />
                                                        </div>
                                                        <span className={`text-[8px] ${isCenter ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                                                            {isCenter ? '当' : dayLabel}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center py-8">
                            <p className="text-sm text-gray-400">点击日期查看详情</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
