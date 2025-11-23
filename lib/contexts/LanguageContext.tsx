'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'cn' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
    cn: {
        'nav.method': '方法',
        'nav.pricing': '定价',
        'nav.login': '登录',
        'nav.learning': '学习中心',
        'nav.getStarted': '开始使用',
        'hero.title': '刻在脑海里。',
        'hero.subtitle': '不仅仅是记忆，而是通过AI驱动的情境学习，让单词成为你的一部分。',
        'hero.cta': '开始旅程',
        'hero.howItWorks': '工作原理',
        'hero.demo.input': '输入',
        'hero.demo.review': '复习',
        'hero.demo.decks': '卡组',
        'hero.demo.generate': '生成卡片：',
        'hero.demo.list': '生成列表',
        'hero.demo.preview': '预览',
        'hero.demo.clickToFlip': '点击翻转',
        'dashboard.newMemory': '新记忆',
        'dashboard.input': '输入',
        'dashboard.dailyReview': '每日回顾',
        'dashboard.srsQueue': '间隔重复队列',
        'profile.hello': '你好',
        'profile.currentGoal': '当前目标',
        'profile.totalWords': '总词汇量',
        'profile.mastered': '已掌握',
        'profile.dayStreak': '连续打卡',
        'profile.timeSpent': '学习时长',
        'profile.learningProgress': '学习进度',
        'profile.activityChart': '活动图表即将推出',
        'vocab.title': '我的词汇',
        'vocab.collected': '个单词已收集',
        'vocab.search': '搜索单词...',
        'vocab.word': '单词',
        'vocab.translation': '释义',
        'vocab.status': '状态',
        'vocab.nextReview': '下次复习',
        'vocab.filter.all': '全部',
        'vocab.filter.learning': '学习中',
        'vocab.filter.mastered': '已掌握',
        'vocab.status.new': '新词',
        'vocab.status.learning': '学习中',
        'vocab.status.mastered': '已掌握',
        'pricing.cadence': '选择你的节奏',
        'pricing.title': '精通计划，零摩擦',
        'pricing.subtitle': '保持免费轨道或解锁Pro以消除上限，访问跟读模式，让ENGRAM如你所想般快速运行。',
        'pricing.starter': '入门版',
        'pricing.perfect': '适合休闲学习者。',
        'pricing.pro': '专业版',
        'pricing.mastery': '为了真正的精通。',
        'pricing.upgrade': '立即升级',
        'pricing.downgrade': '降级',
        'pricing.current': '当前计划',
        'pricing.active': '当前计划',
    },
    en: {
        'nav.method': 'Method',
        'nav.pricing': 'Pricing',
        'nav.login': 'Login',
        'nav.learning': 'Learning',
        'nav.getStarted': 'Get Started',
        'hero.title': 'Carve it in your mind.',
        'hero.subtitle': 'More than memory. Make words part of you through AI-driven contextual learning.',
        'hero.cta': 'Start Your Journey',
        'hero.howItWorks': 'How it works',
        'hero.demo.input': 'Input',
        'hero.demo.review': 'Review',
        'hero.demo.decks': 'Decks',
        'hero.demo.generate': 'Generate cards for',
        'hero.demo.list': 'Generated List',
        'hero.demo.preview': 'Preview',
        'hero.demo.clickToFlip': 'Click to flip',
        'dashboard.newMemory': 'New Memory',
        'dashboard.input': 'Input',
        'dashboard.dailyReview': 'Daily Review',
        'dashboard.srsQueue': 'SRS Queue',
        'profile.hello': 'Hello',
        'profile.currentGoal': 'Current Goal',
        'profile.totalWords': 'Total Words',
        'profile.mastered': 'Mastered',
        'profile.dayStreak': 'Day Streak',
        'profile.timeSpent': 'Time Spent',
        'profile.learningProgress': 'Learning Progress',
        'profile.activityChart': 'Activity Chart Coming Soon',
        'vocab.title': 'My Vocabulary',
        'vocab.collected': 'words collected',
        'vocab.search': 'Search words...',
        'vocab.word': 'Word',
        'vocab.translation': 'Translation',
        'vocab.status': 'Status',
        'vocab.nextReview': 'Next Review',
        'vocab.filter.all': 'All',
        'vocab.filter.learning': 'Learning',
        'vocab.filter.mastered': 'Mastered',
        'vocab.status.new': 'New',
        'vocab.status.learning': 'Learning',
        'vocab.status.mastered': 'Mastered',
        'pricing.cadence': 'Choose your cadence',
        'pricing.title': 'Mastery Plans, Zero Friction',
        'pricing.subtitle': 'Stay on the free track or unlock Pro to remove ceilings, access shadowing, and keep ENGRAM running as fast as you think.',
        'pricing.starter': 'Starter',
        'pricing.perfect': 'Perfect for casual learners.',
        'pricing.pro': 'Pro',
        'pricing.mastery': 'For serious mastery.',
        'pricing.upgrade': 'Upgrade Now',
        'pricing.downgrade': 'Downgrade',
        'pricing.current': 'Current Plan',
        'pricing.active': 'Active Plan',
    }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('cn'); // Default to CN as requested

    useEffect(() => {
        const saved = localStorage.getItem('engram-lang') as Language;
        if (saved) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('engram-lang', lang);
    };

    const t = (key: string) => {
        return translations[language][key as keyof typeof translations['cn']] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
