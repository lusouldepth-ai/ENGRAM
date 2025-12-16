/**
 * 词库导入脚本
 * 
 * 使用方法:
 * npx ts-node --compiler-options '{"module":"commonjs"}' scripts/import-vocab.ts
 * 
 * 或在开发环境:
 * npm run import-vocab
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VocabBookMeta {
    title: string;
    category: string;
    cefrLevel: string;
    description?: string;
}

async function importVocabBook(jsonFileName: string, meta: VocabBookMeta) {
    console.log(`\n📚 开始导入: ${meta.title}`);

    try {
        // 读取 JSON 文件
        const filePath = path.join(process.cwd(), 'data', jsonFileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const words = JSON.parse(fileContent);

        if (!Array.isArray(words)) {
            throw new Error('JSON file must contain an array');
        }

        console.log(`   📄 读取到 ${words.length} 个单词`);

        // 提取 bookId
        const bookId = words[0]?.bookId || jsonFileName.replace('.json', '');

        // 检查词书是否已存在
        const { data: existingBook } = await supabase
            .from('vocab_books')
            .select('id')
            .eq('book_id', bookId)
            .single();

        if (existingBook) {
            console.log(`   ⚠️ 词书已存在，跳过创建`);
            return { success: true, bookId: existingBook.id, skipped: true };
        }

        // 创建词书记录
        const { data: book, error: bookError } = await supabase
            .from('vocab_books')
            .insert({
                book_id: bookId,
                title: meta.title,
                word_count: words.length,
                cefr_level: meta.cefrLevel,
                category: meta.category,
                description: meta.description
            })
            .select('id')
            .single();

        if (bookError) {
            throw new Error(`创建词书失败: ${bookError.message}`);
        }

        console.log(`   ✅ 词书创建成功: ${book.id}`);

        // 批量插入单词 (每批 100 个)
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);

            const vocabWords = batch.map((word: any) => ({
                book_id: book.id,
                word_rank: word.wordRank,
                head_word: word.headWord,
                us_phonetic: word.content?.word?.content?.usphone || null,
                uk_phonetic: word.content?.word?.content?.ukphone || null,
                translations: word.content?.word?.content?.trans || null,
                sentences: word.content?.word?.content?.sentence?.sentences || null,
                real_exam_sentences: word.content?.word?.content?.realExamSentence?.sentences || null,
                synonyms: word.content?.word?.content?.syno?.synos || null,
                phrases: word.content?.word?.content?.phrase?.phrases || null,
                memory_method: word.content?.word?.content?.remMethod?.val || null,
                related_words: word.content?.word?.content?.relWord?.rels || null,
                picture_url: word.content?.word?.content?.picture || null,
                exams: word.content?.word?.content?.exam || null,
                raw_content: word
            }));

            const { error: insertError } = await supabase
                .from('vocab_words')
                .insert(vocabWords);

            if (insertError) {
                console.error(`   ❌ 批次 ${i / batchSize + 1} 插入失败:`, insertError.message);
            } else {
                insertedCount += batch.length;
                process.stdout.write(`\r   📥 已导入: ${insertedCount}/${words.length}`);
            }
        }

        console.log(`\n   ✅ 导入完成: ${insertedCount}/${words.length} 个单词`);

        return {
            success: true,
            bookId: book.id,
            importedCount: insertedCount,
            totalCount: words.length
        };

    } catch (error: any) {
        console.error(`   ❌ 导入失败:`, error.message);
        return { success: false, error: error.message };
    }
}

// 主函数
async function main() {
    console.log('🚀 ENGRAM 词库导入工具\n');
    console.log('='.repeat(50));

    // 导入 CET4 词库
    await importVocabBook('cet4-core-vocabulary.json', {
        title: '四级真题核心词',
        category: '四六级',
        cefrLevel: 'B1',
        description: '大学英语四级考试核心高频词汇，包含真题例句和答题技巧'
    });

    // 导入 CET6 词库
    await importVocabBook('cet6-core-vocabulary.json', {
        title: '六级真题核心词',
        category: '四六级',
        cefrLevel: 'B2',
        description: '大学英语六级考试核心高频词汇，包含真题例句和答题技巧'
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有导入任务完成!');
}

main().catch(console.error);
