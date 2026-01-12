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
        'hero.title': '让记忆成为本能',
        'hero.subtitle': '不仅仅是记忆，AI驱动的情境学习，让单词成为你的一部分',
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
        'settings.title': '个人设置',
        'settings.subtitle': '管理您的个人偏好和学习目标。',
        'settings.displayName': '显示名称',
        'settings.displayNamePlaceholder': '您的名称',
        'settings.learningGoal': '学习目标',
        'settings.learningGoalPlaceholder': '选择目标',
        'settings.goal.general': '日常流利',
        'settings.goal.business': '商务英语',
        'settings.goal.ielts': '雅思备考',
        'settings.goal.toefl': '托福备考',
        'settings.goal.academic': '学术英语',
        'settings.englishLevel': '英语水平',
        'settings.levelPlaceholder': '选择水平',
        'settings.level.beginner': '初级 (A1-A2)',
        'settings.level.intermediate': '中级 (B1-B2)',
        'settings.level.advanced': '高级 (C1-C2)',
        'settings.accent': '口音偏好',
        'settings.accentPlaceholder': '选择口音',
        'settings.accent.us': '美式 (US)',
        'settings.accent.uk': '英式 (UK)',
        'settings.dailyGoal': '每日新词目标',
        'settings.dailyGoalUnit': '个/天',
        'settings.dailyGoal.easy': '轻松',
        'settings.dailyGoal.medium': '适中',
        'settings.dailyGoal.hard': '挑战',
        'settings.save': '保存更改',
        'settings.saving': '保存中...',
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
        'settings.title': 'Profile Settings',
        'settings.subtitle': 'Manage your personal preferences and learning goals.',
        'settings.displayName': 'Display Name',
        'settings.displayNamePlaceholder': 'Your name',
        'settings.learningGoal': 'Learning Goal',
        'settings.learningGoalPlaceholder': 'Select a goal',
        'settings.goal.general': 'General Fluency',
        'settings.goal.business': 'Business English',
        'settings.goal.ielts': 'IELTS Preparation',
        'settings.goal.toefl': 'TOEFL Preparation',
        'settings.goal.academic': 'Academic English',
        'settings.englishLevel': 'English Level',
        'settings.levelPlaceholder': 'Select your level',
        'settings.level.beginner': 'Beginner (A1-A2)',
        'settings.level.intermediate': 'Intermediate (B1-B2)',
        'settings.level.advanced': 'Advanced (C1-C2)',
        'settings.accent': 'Accent Preference',
        'settings.accentPlaceholder': 'Select accent',
        'settings.accent.us': 'American (US)',
        'settings.accent.uk': 'British (UK)',
        'settings.dailyGoal': 'Daily New Words Goal',
        'settings.dailyGoalUnit': 'words/day',
        'settings.dailyGoal.easy': 'Easy',
        'settings.dailyGoal.medium': 'Medium',
        'settings.dailyGoal.hard': 'Hard',
        'settings.save': 'Save Changes',
        'settings.saving': 'Saving...',
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
