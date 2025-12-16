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

/**
 * 验证日期是否有效
 * ts-fsrs 返回的 Date 对象可能不是标准 Date 实例，所以不能用 instanceof 检查
 */
function isValidDate(date: unknown): boolean {
    if (!date) return false;
    // 尝试获取时间戳，如果成功且不是 NaN，则日期有效
    const timestamp = (date as Date).getTime?.();
    return typeof timestamp === 'number' && !isNaN(timestamp) && isFinite(timestamp);
}

/**
 * 安全地解析日期字符串，无效时返回当前时间
 */
function parseDateSafely(dateStr: string | null | undefined): Date {
    if (!dateStr) {
        console.warn('⚠️ [FSRS] due 字段为空，使用当前时间作为回退');
        return new Date();
    }
    const parsed = new Date(dateStr);
    if (!isValidDate(parsed)) {
        console.warn(`⚠️ [FSRS] 无效的日期格式: "${dateStr}"，使用当前时间作为回退`);
        return new Date();
    }
    return parsed;
}

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
        due: parseDateSafely(currentCard.due),
        stability: currentCard.stability || 0,
        difficulty: currentCard.difficulty || 0,
        reps: currentCard.reps || 0,
        lapses: 0,
        state: currentCard.state ?? 0,  // 0 = New card
        learning_steps: 0,
        elapsed_days: 0,
        scheduled_days: 0,
    };

    console.log('📊 [FSRS DEBUG] Input card state:', {
        due: cardInput.due.toISOString(),
        stability: cardInput.stability,
        difficulty: cardInput.difficulty,
        reps: cardInput.reps,
        state: cardInput.state,
        rating: rating,
        fsrsGrade: fsrsGrade,
    });

    // 使用 FSRS 算法计算下一次复习
    const result: RecordLogItem = f.next(cardInput, now, fsrsGrade);
    const nextCard = result.card;

    console.log('📊 [FSRS DEBUG] Output card:', {
        due: nextCard.due,
        scheduled_days: nextCard.scheduled_days,
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        state: nextCard.state,
    });

    // 验证返回的日期是否有效，使用多层回退策略
    let dueDate: Date;
    if (isValidDate(nextCard.due)) {
        dueDate = nextCard.due;
    } else {
        console.warn('⚠️ [FSRS] 计算结果的 due 日期无效');
        // 尝试使用 scheduled_days 计算
        const scheduledMs = nextCard.scheduled_days * 24 * 60 * 60 * 1000;
        if (!isNaN(scheduledMs) && isFinite(scheduledMs)) {
            dueDate = new Date(now.getTime() + scheduledMs);
        } else {
            // 最终回退：使用当前时间 + 10 分钟
            console.warn('⚠️ [FSRS] scheduled_days 也无效，使用 now + 10 分钟作为回退');
            dueDate = new Date(now.getTime() + 10 * 60 * 1000);
        }
    }

    // 最终安全检查
    if (!isValidDate(dueDate)) {
        console.error('🚨 [FSRS] 所有日期计算均失败，强制使用当前时间');
        dueDate = new Date();
    }

    return {
        due: dueDate.toISOString(),
        stability: nextCard.stability ?? 0,
        difficulty: nextCard.difficulty ?? 0,
        reps: nextCard.reps ?? 0,
        state: nextCard.state ?? 0,
        scheduledDays: isNaN(nextCard.scheduled_days) ? 0 : nextCard.scheduled_days,
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
    const now = new Date();

    for (const rating of ratings) {
        try {
            const preview = processReview(currentCard, rating);
            // 对于学习阶段的卡片，scheduled_days 可能是 0
            // 需要从 due 日期计算实际间隔
            let actualDays = preview.scheduledDays;
            if (actualDays === 0 && preview.due) {
                const dueDate = new Date(preview.due);
                if (isValidDate(dueDate)) {
                    actualDays = (dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
                    if (actualDays < 0) actualDays = 0;
                }
            }
            result[rating] = {
                scheduledDays: actualDays,
                display: getScheduleDescription(actualDays),
            };
        } catch (error) {
            console.error(`⚠️ [FSRS] 预览 ${rating} 失败:`, error);
            // 使用默认值回退
            const defaults = { forgot: '1m', hard: '10m', good: '1d', easy: '4d' };
            result[rating] = {
                scheduledDays: 0,
                display: defaults[rating],
            };
        }
    }

    return result;
}
