/**
 * 词库数据处理工具函数
 */

/**
 * 将词库数据转换为卡片格式
 */
export function vocabToCardFormat(vocabWord: any) {
    if (!vocabWord) return null;

    const translations = vocabWord.translations || [];
    const sentences = vocabWord.sentences || [];
    const realExamSentences = vocabWord.real_exam_sentences || [];

    // 获取主要释义
    const mainTrans = translations[0];
    const translation = mainTrans?.tranCn || '';
    const definition = mainTrans?.tranOther || '';
    const pos = mainTrans?.pos || '';

    // 获取例句
    const example = sentences[0]?.sContent || '';
    const exampleCn = sentences[0]?.sCn || '';

    // 获取真题例句
    const examExample = realExamSentences[0];

    return {
        front: vocabWord.head_word,
        back: translation,
        phonetic: vocabWord.us_phonetic || vocabWord.uk_phonetic || '',
        definition: definition,
        example: example,
        exampleCn: exampleCn,
        pos: pos,
        // 词库特有字段
        realExamSentence: examExample?.sContent || null,
        realExamSource: examExample?.sourceInfo || null,
        memoryMethod: vocabWord.memory_method || null,
        synonyms: vocabWord.synonyms || null,
        phrases: vocabWord.phrases?.slice(0, 5) || null,
        relatedWords: vocabWord.related_words || null,
        vocabBookTitle: vocabWord.vocab_books?.title || null,
        cefrLevel: vocabWord.vocab_books?.cefr_level || null,
        // 标记来源
        source: 'vocabulary_library'
    };
}
