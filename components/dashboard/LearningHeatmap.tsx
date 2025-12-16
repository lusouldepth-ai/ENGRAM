'use client';

import { useMemo } from 'react';

interface ActivityDay {
    date: string;
    count: number;
}

interface LearningHeatmapProps {
    activityData: ActivityDay[];
}

/**
 * GitHub 风格的学习活动热力图
 * 显示过去一年的学习记录
 */
export function LearningHeatmap({ activityData }: LearningHeatmapProps) {
    // 生成过去一年的日期网格
    const { weeks, months } = useMemo(() => {
        const today = new Date();
        const weeks: { date: Date; count: number }[][] = [];
        const months: { name: string; col: number }[] = [];

        // 从一年前开始
        const startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        // 调整到那周的周日
        startDate.setDate(startDate.getDate() - startDate.getDay());

        // 创建日期到计数的映射
        const countMap = new Map<string, number>();
        activityData.forEach(day => {
            countMap.set(day.date, day.count);
        });

        let currentMonth = -1;
        let currentDate = new Date(startDate);

        // 生成53周
        for (let week = 0; week < 53; week++) {
            const weekData: { date: Date; count: number }[] = [];

            for (let day = 0; day < 7; day++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const count = countMap.get(dateStr) || 0;

                // 跟踪月份变化
                if (currentDate.getMonth() !== currentMonth && day === 0) {
                    currentMonth = currentDate.getMonth();
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    months.push({ name: monthNames[currentMonth], col: week });
                }

                weekData.push({
                    date: new Date(currentDate),
                    count
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            weeks.push(weekData);
        }

        return { weeks, months };
    }, [activityData]);

    // 根据活动量获取颜色
    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        if (count <= 2) return 'bg-green-200';
        if (count <= 5) return 'bg-green-400';
        if (count <= 10) return 'bg-green-500';
        return 'bg-green-600';
    };

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
            <div className="min-w-[700px]">
                {/* 月份标签 */}
                <div className="flex text-xs text-gray-400 mb-1">
                    <div className="w-8" /> {/* 留白给日期标签 */}
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
                    {/* 星期标签 */}
                    <div className="flex flex-col justify-around text-xs text-gray-400 w-8 pr-2">
                        {dayLabels.map((label, i) => (
                            <span key={i} className="h-3 leading-3">{label}</span>
                        ))}
                    </div>

                    {/* 日期方块 */}
                    <div className="flex gap-[3px]">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                {week.map((day, dayIndex) => {
                                    const dateStr = day.date.toLocaleDateString('zh-CN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    });
                                    const tooltip = `${dateStr}: ${day.count} 次学习`;

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors hover:ring-2 hover:ring-gray-400 cursor-default`}
                                            title={tooltip}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 图例 */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-100" />
                        <div className="w-3 h-3 rounded-sm bg-green-200" />
                        <div className="w-3 h-3 rounded-sm bg-green-400" />
                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                        <div className="w-3 h-3 rounded-sm bg-green-600" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
