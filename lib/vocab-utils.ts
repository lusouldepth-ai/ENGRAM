// 词汇工具函数 - 非服务器操作
// 将数据库词汇转换为卡片格式

export interface VocabWord {
    id: string;
    head_word: string;
    us_phonetic: string | null;
    uk_phonetic: string | null;
    translations: any; // JSONB
    sentences: any; // JSONB
    real_exam_sentences: any; // JSONB
    synonyms: any; // JSONB
    phrases: any; // JSONB
    memory_method: string | null;
    related_words: any; // JSONB
}

export function vocabWordToCard(word: VocabWord, uiLanguage: string = 'cn') {
    // 提取翻译
    let translation = '';
    if (word.translations && Array.isArray(word.translations)) {
        translation = word.translations
            .map((t: any) => `${t.pos || ''} ${t.tranCn || ''}`.trim())
            .filter(Boolean)
            .join('；');
    }

    // 提取例句
    let example = '';
    if (word.sentences && Array.isArray(word.sentences) && word.sentences.length > 0) {
        const sentence = word.sentences[0];
        example = sentence.sContent || '';
    }

    // 提取真题例句作为 shadow sentence
    let shadowSentence = '';
    let shadowTranslation = '';
    if (word.real_exam_sentences && Array.isArray(word.real_exam_sentences) && word.real_exam_sentences.length > 0) {
        const realSentence = word.real_exam_sentences[0];
        shadowSentence = realSentence.sContent || '';
        // 真题例句通常没有中文翻译，留空让 AI 补充
    } else if (word.sentences && Array.isArray(word.sentences) && word.sentences.length > 0) {
        // 如果没有真题例句，使用普通例句
        const sentence = word.sentences[0];
        shadowSentence = sentence.sContent || '';
        shadowTranslation = sentence.sCn || '';
    }

    // 提取短语搭配
    let shortUsage = '';
    if (word.phrases && Array.isArray(word.phrases) && word.phrases.length > 0) {
        shortUsage = word.phrases.slice(0, 2).map((p: any) => p.pContent).join(', ');
    }

    return {
        front: word.head_word,
        phonetic: word.us_phonetic || word.uk_phonetic || '',
        pos: word.translations?.[0]?.pos || '',
        translation: translation,
        definition: '', // 让 AI 补充英文定义
        example: example,
        short_usage: shortUsage,
        shadow_sentence: shadowSentence,
        shadow_sentence_translation: shadowTranslation,
        root_analysis: word.memory_method || '', // 词根分析/记忆方法
        // 额外元数据供 AI 增强使用
        _synonyms: word.synonyms,
        _related_words: word.related_words,
    };
}
