"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile, generateStarterCards, saveStarterCards } from "@/app/actions/onboarding-actions";
import { Loader2, ArrowRight, Check, X, GraduationCap, Briefcase, Plane, BookOpen, Building2, Coffee, Film, MessageCircle } from "lucide-react";
import { CardData } from "@/app/actions/save-cards";

type Step = 'identity' | 'purpose' | 'level' | 'scenario' | 'accent' | 'loading' | 'selection';

// 身份选项
const IDENTITY_OPTIONS = [
    { value: "student_high", label: "高中生", icon: GraduationCap, desc: "备考或提升英语成绩" },
    { value: "student_college", label: "大学生", icon: GraduationCap, desc: "四六级/考研/留学" },
    { value: "professional", label: "职场人士", icon: Briefcase, desc: "工作中需要使用英语" },
    { value: "freelancer", label: "自由职业", icon: Coffee, desc: "远程工作/自媒体/跨境" },
];

// 学习目的选项
const PURPOSE_OPTIONS = [
    { value: "exam_ielts", label: "雅思备考", desc: "IELTS 考试准备" },
    { value: "exam_toefl", label: "托福备考", desc: "TOEFL 考试准备" },
    { value: "exam_cet", label: "四六级考试", desc: "CET-4/CET-6" },
    { value: "work_meeting", label: "职场沟通", desc: "会议、邮件、汇报" },
    { value: "travel", label: "出国旅行", desc: "旅行中的日常交流" },
    { value: "daily", label: "日常提升", desc: "综合提升英语能力" },
    { value: "media", label: "影视娱乐", desc: "看美剧、听歌、阅读" },
];

// 英语水平选项 - 更详细的描述
const LEVEL_OPTIONS = [
    { value: "beginner", label: "入门", desc: "认识约500个单词，能说简单句子", cefr: "A1" },
    { value: "elementary", label: "初级", desc: "高中水平，能进行简单日常对话", cefr: "A2" },
    { value: "intermediate", label: "中级", desc: "大学四级水平，能阅读简单文章", cefr: "B1" },
    { value: "upper_intermediate", label: "中高级", desc: "大学六级水平，能流畅阅读写作", cefr: "B2" },
    { value: "advanced", label: "高级", desc: "专业水平，接近母语使用者", cefr: "C1" },
];

// 具体场景选项 - 根据目的动态显示
const SCENARIO_OPTIONS: Record<string, { value: string; label: string; desc: string }[]> = {
    exam_ielts: [
        { value: "ielts_academic", label: "学术类", desc: "留学、学术研究" },
        { value: "ielts_general", label: "培训类", desc: "移民、工作签证" },
    ],
    exam_toefl: [
        { value: "toefl_undergrad", label: "本科申请", desc: "申请美国本科" },
        { value: "toefl_graduate", label: "研究生申请", desc: "申请硕士/博士" },
    ],
    exam_cet: [
        { value: "cet4", label: "四级", desc: "CET-4 考试" },
        { value: "cet6", label: "六级", desc: "CET-6 考试" },
    ],
    work_meeting: [
        { value: "work_it", label: "互联网/IT", desc: "技术交流、产品讨论" },
        { value: "work_finance", label: "金融/投资", desc: "财务报告、投资分析" },
        { value: "work_trade", label: "外贸/销售", desc: "客户沟通、商务谈判" },
        { value: "work_general", label: "通用商务", desc: "日常办公英语" },
    ],
    travel: [
        { value: "travel_airport", label: "机场/交通", desc: "登机、问路、打车" },
        { value: "travel_hotel", label: "酒店/住宿", desc: "预订、入住、服务" },
        { value: "travel_food", label: "餐饮/购物", desc: "点餐、购物、砍价" },
        { value: "travel_emergency", label: "紧急情况", desc: "就医、求助、报警" },
    ],
    daily: [
        { value: "daily_social", label: "社交聊天", desc: "交朋友、闲聊" },
        { value: "daily_news", label: "新闻阅读", desc: "时事、科技、财经" },
        { value: "daily_life", label: "生活起居", desc: "家庭、健康、爱好" },
    ],
    media: [
        { value: "media_drama", label: "美剧/电影", desc: "口语表达、俚语" },
        { value: "media_music", label: "英文歌曲", desc: "歌词理解、唱歌" },
        { value: "media_book", label: "原版阅读", desc: "小说、非虚构" },
        { value: "media_podcast", label: "播客/演讲", desc: "TED、访谈节目" },
    ],
};

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('identity');
    const [formData, setFormData] = useState({
        identity: "",
        purpose: "",
        level: "",
        scenario: "",
        accent: "",
        target_score: "",
        exam_date: "",
    });
    const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
    const [selectedCardIndices, setSelectedCardIndices] = useState<Set<number>>(new Set());

    // 获取当前目的对应的场景选项
    const currentScenarios = SCENARIO_OPTIONS[formData.purpose] || [];

    // Step handlers
    const handleSelect = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = async () => {
        switch (step) {
            case 'identity':
                if (formData.identity) setStep('purpose');
                break;
            case 'purpose':
                if (formData.purpose) {
                    // 保存部分数据
                    await updateProfile({
                        learning_goal: formData.purpose,
                    });
                    setStep('level');
                }
                break;
            case 'level':
                if (formData.level) {
                    // 如果有对应的场景选项，显示场景选择；否则直接到口音
                    if (SCENARIO_OPTIONS[formData.purpose]?.length > 0) {
                        setStep('scenario');
                    } else {
                        setStep('accent');
                    }
                }
                break;
            case 'scenario':
                if (formData.scenario || !currentScenarios.length) setStep('accent');
                break;
            case 'accent':
                if (formData.accent) {
                    await startGeneration();
                }
                break;
        }
    };

    const prevStep = () => {
        switch (step) {
            case 'purpose': setStep('identity'); break;
            case 'level': setStep('purpose'); break;
            case 'scenario': setStep('level'); break;
            case 'accent': 
                if (SCENARIO_OPTIONS[formData.purpose]?.length > 0) {
                    setStep('scenario');
                } else {
                    setStep('level');
                }
                break;
        }
    };

    const startGeneration = async () => {
        setStep('loading');

        // 保存完整的用户配置
        const accentValue = formData.accent === "British (UK)" ? "UK" : "US";
        await updateProfile({
            english_level: formData.level,
            accent_preference: accentValue,
            learning_goal: formData.purpose,
        });

        // 构建更详细的生成提示
        const identityLabel = IDENTITY_OPTIONS.find(o => o.value === formData.identity)?.label || formData.identity;
        const purposeLabel = PURPOSE_OPTIONS.find(o => o.value === formData.purpose)?.label || formData.purpose;
        const levelInfo = LEVEL_OPTIONS.find(o => o.value === formData.level);
        const scenarioLabel = currentScenarios.find(o => o.value === formData.scenario)?.label || "";

        // 生成个性化单词 - 注意：传递 formData.level（如 "elementary"）而不是中文标签
        const result = await generateStarterCards(
            `${identityLabel} - ${purposeLabel}${scenarioLabel ? ` (${scenarioLabel})` : ""}`,
            formData.level  // 传递 CEFR 级别值，如 beginner, elementary, intermediate 等
        );

        if (result.success && result.cards) {
            setGeneratedCards(result.cards);
            setSelectedCardIndices(new Set(result.cards.map((_: any, i: number) => i)));
            setStep('selection');
        } else {
            alert("生成失败，请重试");
            setStep('accent');
        }
    };

    const toggleCardSelection = (index: number) => {
        const newSet = new Set(selectedCardIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedCardIndices(newSet);
    };

    const submitSelection = async () => {
        if (selectedCardIndices.size === 0) {
            alert("请至少选择一个单词开始学习");
            return;
        }

        const cardsToSave = generatedCards.filter((_, i) => selectedCardIndices.has(i));
        let result;

        try {
            result = await saveStarterCards(cardsToSave);
        } catch (err) {
            console.error("保存入门词汇时出错", err);
        }

        if (result?.success) {
            router.push('/dashboard');
        } else {
            alert("保存失败，请重试");
        }
    };

    // 计算进度
    const getProgress = () => {
        const steps = ['identity', 'purpose', 'level', 'scenario', 'accent'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex === -1) return 100;
        return ((currentIndex + 1) / steps.length) * 100;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-braun-bg text-braun-text animate-fade-in selection:bg-braun-accent selection:text-white py-12">
            
            {/* Progress Bar */}
            {step !== 'loading' && step !== 'selection' && (
                <div className="fixed top-0 left-0 w-full h-1 bg-gray-200">
                    <motion.div 
                        className="h-full bg-braun-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgress()}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}

            <AnimatePresence mode="wait">

                {/* STEP 1: Identity */}
                {step === 'identity' && (
                    <motion.div
                        key="step-identity"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500 uppercase tracking-wider">Step 1/5</p>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">你是谁？</h2>
                            <p className="text-gray-500">选择最符合你当前状态的选项</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {IDENTITY_OPTIONS.map((opt) => (
                                <SelectionCard
                                    key={opt.value}
                                    selected={formData.identity === opt.value}
                                    onClick={() => handleSelect('identity', opt.value)}
                                    icon={opt.icon}
                                    label={opt.label}
                                    desc={opt.desc}
                                />
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={nextStep}
                                disabled={!formData.identity}
                                className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                            >
                                下一步 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: Purpose */}
                {step === 'purpose' && (
                    <motion.div
                        key="step-purpose"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500 uppercase tracking-wider">Step 2/5</p>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">学习目的？</h2>
                            <p className="text-gray-500">这将帮助我们为你定制最相关的词汇</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {PURPOSE_OPTIONS.map((opt) => (
                                <SelectionButton
                                    key={opt.value}
                                    selected={formData.purpose === opt.value}
                                    onClick={() => handleSelect('purpose', opt.value)}
                                >
                                    <div className="text-left">
                                        <div className="font-medium">{opt.label}</div>
                                        <div className={`text-xs mt-1 ${formData.purpose === opt.value ? "text-gray-600" : "text-gray-400"}`}>{opt.desc}</div>
                                    </div>
                                </SelectionButton>
                            ))}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={prevStep} className="text-gray-500">
                                返回
                            </Button>
                            <Button
                                onClick={nextStep}
                                disabled={!formData.purpose}
                                className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                            >
                                下一步 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: Level */}
                {step === 'level' && (
                    <motion.div
                        key="step-level"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500 uppercase tracking-wider">Step 3/5</p>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">你的英语水平？</h2>
                            <p className="text-gray-500">诚实选择，我们会匹配合适难度的词汇</p>
                        </div>

                        <div className="space-y-3">
                            {LEVEL_OPTIONS.map((opt) => (
                                <SelectionButton
                                    key={opt.value}
                                    selected={formData.level === opt.value}
                                    onClick={() => handleSelect('level', opt.value)}
                                    className="w-full"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="text-left">
                                            <div className="font-medium">{opt.label}</div>
                                            <div className={`text-xs mt-1 ${formData.level === opt.value ? "text-gray-600" : "text-gray-400"}`}>{opt.desc}</div>
                                        </div>
                                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                            formData.level === opt.value 
                                                ? "bg-braun-accent text-white" 
                                                : "bg-gray-100 text-gray-500"
                                        }`}>{opt.cefr}</span>
                                    </div>
                                </SelectionButton>
                            ))}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={prevStep} className="text-gray-500">
                                返回
                            </Button>
                            <Button
                                onClick={nextStep}
                                disabled={!formData.level}
                                className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                            >
                                下一步 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: Scenario (Conditional) */}
                {step === 'scenario' && currentScenarios.length > 0 && (
                    <motion.div
                        key="step-scenario"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500 uppercase tracking-wider">Step 4/5</p>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">具体场景？</h2>
                            <p className="text-gray-500">选择你最常用的场景，获得更精准的词汇</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {currentScenarios.map((opt) => (
                                <SelectionButton
                                    key={opt.value}
                                    selected={formData.scenario === opt.value}
                                    onClick={() => handleSelect('scenario', opt.value)}
                                >
                                    <div className="text-left">
                                        <div className="font-medium">{opt.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                                    </div>
                                </SelectionButton>
                            ))}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={prevStep} className="text-gray-500">
                                返回
                            </Button>
                            <Button
                                onClick={nextStep}
                                disabled={!formData.scenario}
                                className="rounded-full px-8 py-6 text-lg bg-braun-text hover:bg-black text-white transition-all"
                            >
                                下一步 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 5: Accent */}
                {step === 'accent' && (
                    <motion.div
                        key="step-accent"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-2xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500 uppercase tracking-wider">Step 5/5</p>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">口音偏好？</h2>
                            <p className="text-gray-500">选择你想学习的发音风格</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <SelectionButton
                                selected={formData.accent === "American (US)"}
                                onClick={() => handleSelect('accent', "American (US)")}
                                className="py-8"
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🇺🇸</div>
                                    <div className="font-medium">美式英语</div>
                                    <div className="text-xs text-gray-500 mt-1">American English</div>
                                </div>
                            </SelectionButton>
                            <SelectionButton
                                selected={formData.accent === "British (UK)"}
                                onClick={() => handleSelect('accent', "British (UK)")}
                                className="py-8"
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🇬🇧</div>
                                    <div className="font-medium">英式英语</div>
                                    <div className="text-xs text-gray-500 mt-1">British English</div>
                                </div>
                            </SelectionButton>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={prevStep} className="text-gray-500">
                                返回
                            </Button>
                            <Button
                                onClick={nextStep}
                                disabled={!formData.accent}
                                className="rounded-full px-8 py-6 text-lg bg-braun-accent hover:bg-orange-700 text-white transition-all"
                            >
                                开始生成我的词汇 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {step === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center space-y-6"
                    >
                        <div className="flex justify-center">
                            <Loader2 className="w-16 h-16 animate-spin text-braun-accent" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-braun-text">正在为你定制词汇...</h2>
                            <p className="text-lg text-gray-500">AI 正在根据你的背景生成最适合的单词</p>
                        </div>
                        <div className="text-sm text-gray-400 max-w-md mx-auto">
                            <p>• 匹配你的 {LEVEL_OPTIONS.find(o => o.value === formData.level)?.label} 水平</p>
                            <p>• 针对 {PURPOSE_OPTIONS.find(o => o.value === formData.purpose)?.label} 场景</p>
                        </div>
                    </motion.div>
                )}

                {/* Selection */}
                {step === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl w-full space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">你的专属词汇</h2>
                            <p className="text-gray-500">取消勾选你已经熟悉的单词，剩下的将加入你的学习计划</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                            {generatedCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => toggleCardSelection(idx)}
                                    className={`
                                        cursor-pointer p-5 rounded-xl border transition-all duration-200 relative group
                                        ${selectedCardIndices.has(idx)
                                            ? "bg-white border-braun-accent shadow-md ring-1 ring-braun-accent"
                                            : "bg-gray-50 border-transparent opacity-60 hover:opacity-100"
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-braun-text">{card.front}</h3>
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center transition-colors
                                            ${selectedCardIndices.has(idx) ? "bg-braun-accent text-white" : "bg-gray-200 text-gray-400"}
                                        `}>
                                            {selectedCardIndices.has(idx) ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 italic mb-2">{card.pos} {card.phonetic}</p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{card.translation || card.definition}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                                已选择 {selectedCardIndices.size} 个单词
                            </div>
                            <Button
                                onClick={submitSelection}
                                disabled={selectedCardIndices.size === 0}
                                className="rounded-full px-8 py-6 text-lg bg-braun-accent hover:bg-orange-700 text-white transition-all"
                            >
                                开始学习 <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}

// Selection Button Component - 优雅的选中状态
function SelectionButton({ 
    children, 
    selected, 
    onClick,
    className = ""
}: { 
    children: React.ReactNode; 
    selected: boolean; 
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                p-5 rounded-2xl border-2 text-base font-medium transition-all duration-300 ease-out
                ${selected
                    ? "bg-gradient-to-br from-orange-50 to-orange-100/50 border-braun-accent text-braun-text shadow-[0_0_0_4px_rgba(234,88,12,0.1)] scale-[1.02]"
                    : "bg-white border-gray-100 text-braun-text hover:border-orange-200 hover:bg-orange-50/30 hover:shadow-md"
                }
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// Selection Card Component (for identity step with icons) - 更精致的卡片设计
function SelectionCard({ 
    selected, 
    onClick, 
    icon: Icon,
    label,
    desc
}: { 
    selected: boolean; 
    onClick: () => void;
    icon: any;
    label: string;
    desc: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                p-6 rounded-2xl border-2 transition-all duration-300 ease-out text-left relative overflow-hidden group
                ${selected
                    ? "bg-gradient-to-br from-orange-50 via-white to-orange-50 border-braun-accent shadow-[0_0_0_4px_rgba(234,88,12,0.1),0_10px_40px_-10px_rgba(234,88,12,0.3)] scale-[1.02]"
                    : "bg-white border-gray-100 text-braun-text hover:border-orange-200 hover:shadow-lg hover:scale-[1.01]"
                }
            `}
        >
            {/* 选中状态的装饰元素 */}
            {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-braun-accent rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                </div>
            )}
            
            {/* 图标容器 */}
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300
                ${selected 
                    ? "bg-braun-accent shadow-lg" 
                    : "bg-orange-50 group-hover:bg-orange-100"
                }
            `}>
                <Icon className={`w-6 h-6 ${selected ? "text-white" : "text-braun-accent"}`} />
            </div>
            
            <div className={`font-bold text-lg ${selected ? "text-braun-text" : "text-braun-text"}`}>
                {label}
            </div>
            <div className={`text-sm mt-1 ${selected ? "text-gray-600" : "text-gray-400"}`}>
                {desc}
            </div>
        </button>
    );
}
