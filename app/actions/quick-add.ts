'use server';

import { generateCards } from "./generate-cards";
import { saveCards } from "./save-cards";
import { lookupVocabWord } from "./vocab-lookup";
import { vocabToCardFormat } from "@/lib/vocab-utils";



/**
 * 快速添加单词卡片
 * 
 * 优先级：
 * 1. 先查词库 vocab_words 表
 * 2. 如果词库有数据，使用词库数据（音标、释义、真题例句等）
 * 3. AI 补充生成 Shadow Sentence
 * 4. 如果词库没有，则完全用 AI 生成
 */
export async function quickAddCard(word: string) {
    if (!word || word.trim().length === 0) {
        return { success: false, error: "No word provided" };
    }

    const cleanWord = word.trim().toLowerCase();
    console.log(`🔍 [QuickAdd] Looking up word: "${cleanWord}"`);

    // 1. 先查词库
    const vocabResult = await lookupVocabWord(cleanWord);

    let cardToSave: any;
    let source: 'vocabulary' | 'ai' = 'ai';

    if (vocabResult.found && vocabResult.word) {
        // ✅ 词库命中！使用词库数据
        console.log(`✅ [QuickAdd] Found in vocab: "${cleanWord}" from "${vocabResult.book?.title}"`);

        const vocabCard = vocabToCardFormat(vocabResult.word);

        if (vocabCard) {
            cardToSave = {
                front: vocabCard.front,
                back: vocabCard.back,
                phonetic: vocabCard.phonetic,
                definition: vocabCard.definition,
                example: vocabCard.example,
                exampleCn: vocabCard.exampleCn,
                // 词库特有字段（会在 StudyCard 中可选显示）
                realExamSentence: vocabCard.realExamSentence,
                realExamSource: vocabCard.realExamSource,
                memoryMethod: vocabCard.memoryMethod,
                synonyms: vocabCard.synonyms,
                phrases: vocabCard.phrases,
                relatedWords: vocabCard.relatedWords,
                vocabBookTitle: vocabCard.vocabBookTitle,
                cefrLevel: vocabCard.cefrLevel,
                source: 'vocabulary_library'
            };
            source = 'vocabulary';
        }
    }

    // 2. 如果词库没有，用 AI 生成
    if (!cardToSave) {
        console.log(`🤖 [QuickAdd] Not in vocab, generating with AI: "${cleanWord}"`);

        const genResult = await generateCards(cleanWord);

        if (!genResult.success || !genResult.data || genResult.data.length === 0) {
            return { success: false, error: genResult.error || "Failed to generate card" };
        }

        cardToSave = {
            ...genResult.data[0],
            source: 'ai_generated'
        };
    }

    // 3. 保存卡片
    const saveResult = await saveCards([cardToSave], "我的生词本");

    if (!saveResult.success) {
        return { success: false, error: saveResult.error };
    }

    console.log(`✅ [QuickAdd] Card saved successfully (source: ${source})`);

    return {
        success: true,
        card: cardToSave,
        source,
        fromVocabBook: source === 'vocabulary' ? cardToSave.vocabBookTitle : null
    };
}
