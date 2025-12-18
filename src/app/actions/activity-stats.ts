'use server';

import { createClient } from "@/lib/supabase/server";

interface DailyActivity {
    date: string;
    count: number;
}

/**
 * 获取用户过去一年的学习活动数据（用于热力图）
 */
export async function getYearlyActivity(): Promise<DailyActivity[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // 获取过去一年的日期范围
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // 获取所有学习记录
    const { data: logs, error } = await supabase
        .from('study_logs')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .gte('reviewed_at', oneYearAgo.toISOString())
        .order('reviewed_at', { ascending: true });

    if (error || !logs) {
        console.error('Error fetching activity:', error);
        return [];
    }

    // 按日期分组计数
    const dailyCounts = new Map<string, number>();

    logs.forEach(log => {
        const date = new Date(log.reviewed_at);
        const dateStr = date.toISOString().split('T')[0];
        dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
    });

    // 转换为数组格式
    return Array.from(dailyCounts.entries()).map(([date, count]) => ({
        date,
        count
    }));
}
