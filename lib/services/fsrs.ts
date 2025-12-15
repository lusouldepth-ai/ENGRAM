import { fsrs, FSRS, Rating, Grade, Card as FSRSCard, RecordLogItem, createEmptyCard } from 'ts-fsrs';

// FSRS 实例（使用默认参数，已针对大多数学习场景优化）
const f: FSRS = fsrs({
    // 目标记忆保持率：90%
    request_retention: 0.9,
    // 最大复习间隔：365 天
    maximum_interval: 365,
    // 启用短期记忆模型
    enable_short_term: true,
});

// 评分映射：应用评分 -> FSRS Grade
export type AppRating = 'forgot' | 'hard' | 'good' | 'easy';

const RATING_MAP: Record<AppRating, Grade> = {
    forgot: Rating.Again as Grade,  // 1 - 完全忘记
    hard: Rating.Hard as Grade,     // 2 - 记得但困难
    good: Rating.Good as Grade,     // 3 - 正常记得
    easy: Rating.Easy as Grade,     // 4 - 非常简单
};

// 掌握阈值
const MASTERY_STABILITY_THRESHOLD = 30;  // stability >= 30 天视为掌握
const MASTERY_REPS_THRESHOLD = 5;         // 连续正确 >= 5 次也视为掌握

/**
 * 创建新卡片的 FSRS 初始状态
 */
export function createNewCardState() {
    const card = createEmptyCard();
    return {
        due: card.due.toISOString(),
        stability: card.stability,
        difficulty: card.difficulty,
        reps: card.reps,
        state: card.state,
    };
}

/**
 * 处理复习并返回新的卡片状态
 * @param currentCard 当前卡片状态（从数据库读取）
 * @param rating 用户评分
 * @returns 新的卡片状态
 */
export function processReview(
    currentCard: {
        due: string;
        stability: number;
        difficulty: number;
        reps: number;
        state: number;
    },
    rating: AppRating
): {
    due: string;
    stability: number;
    difficulty: number;
    reps: number;
    state: number;
    scheduledDays: number;
} {
    const now = new Date();
    const fsrsGrade = RATING_MAP[rating];

    // 构建符合 ts-fsrs 要求的卡片对象
    const cardInput = {
        due: new Date(currentCard.due),
        stability: currentCard.stability || 0,
        difficulty: currentCard.difficulty || 0,
        reps: currentCard.reps || 0,
        lapses: 0,
        state: currentCard.state,
        learning_steps: 0,
        elapsed_days: 0,
        scheduled_days: 0,
    };

    // 使用 FSRS 算法计算下一次复习
    const result: RecordLogItem = f.next(cardInput, now, fsrsGrade);
    const nextCard = result.card;

    return {
        due: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        reps: nextCard.reps,
        state: nextCard.state,
        scheduledDays: nextCard.scheduled_days,
    };
}

/**
 * 判断卡片是否应该标记为已掌握
 */
export function shouldMarkAsMastered(
    stability: number,
    reps: number,
    lastRating: AppRating
): boolean {
    // 条件 1：stability 超过阈值（记忆非常稳定）
    if (stability >= MASTERY_STABILITY_THRESHOLD) {
        return true;
    }

    // 条件 2：复习次数足够多，且最后一次不是忘记
    if (reps >= MASTERY_REPS_THRESHOLD && lastRating !== 'forgot') {
        return true;
    }

    return false;
}

/**
 * 获取调度信息的可读描述
 */
export function getScheduleDescription(scheduledDays: number): string {
    if (scheduledDays < 1) {
        const minutes = Math.round(scheduledDays * 24 * 60);
        if (minutes < 1) return '1m';
        return `${minutes}m`;
    } else if (scheduledDays < 7) {
        return `${Math.round(scheduledDays)}d`;
    } else if (scheduledDays < 30) {
        const weeks = Math.round(scheduledDays / 7);
        return `${weeks}w`;
    } else if (scheduledDays < 365) {
        const months = Math.round(scheduledDays / 30);
        return `${months}mo`;
    } else {
        const years = Math.round(scheduledDays / 365);
        return `${years}y`;
    }
}

/**
 * 预览所有评分选项的下次复习间隔
 * 用于在 UI 上动态显示每个按钮对应的时间
 */
export function previewAllRatings(currentCard: {
    due: string;
    stability: number;
    difficulty: number;
    reps: number;
    state: number;
}): {
    forgot: { scheduledDays: number; display: string };
    hard: { scheduledDays: number; display: string };
    good: { scheduledDays: number; display: string };
    easy: { scheduledDays: number; display: string };
} {
    const ratings: AppRating[] = ['forgot', 'hard', 'good', 'easy'];
    const result: any = {};

    for (const rating of ratings) {
        const preview = processReview(currentCard, rating);
        result[rating] = {
            scheduledDays: preview.scheduledDays,
            display: getScheduleDescription(preview.scheduledDays),
        };
    }

    return result;
}
