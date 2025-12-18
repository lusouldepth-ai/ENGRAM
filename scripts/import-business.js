require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAndParseJson(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Add array brackets if missing
    if (!content.trim().startsWith('[')) {
        content = '[' + content;
    }
    if (!content.trim().endsWith(']')) {
        content = content + ']';
    }

    // Fix missing commas between objects
    content = content.replace(/\}\n\{/g, '},\n{');

    // Save fixed content
    fs.writeFileSync(filePath, content);
    console.log('   📝 JSON 格式已修复');

    return JSON.parse(content);
}

async function importVocabBook(jsonFileName, meta) {
    console.log('\n📚 开始导入: ' + meta.title);

    const filePath = path.join(process.cwd(), 'data', jsonFileName);

    if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
    }

    const words = await fixAndParseJson(filePath);

    if (!Array.isArray(words)) {
        throw new Error('JSON file must contain an array');
    }

    console.log('   📄 读取到 ' + words.length + ' 个单词');

    const bookId = words[0]?.bookId || jsonFileName.replace('.json', '');

    // 检查词书是否已存在
    const { data: existingBook } = await supabase
        .from('vocab_books')
        .select('id')
        .eq('book_id', bookId)
        .single();

    if (existingBook) {
        console.log('   ⚠️ 词书已存在，跳过创建');
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
        throw new Error('创建词书失败: ' + bookError.message);
    }

    console.log('   ✅ 词书创建成功: ' + book.id);

    // 批量插入单词
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);

        const vocabWords = batch.map((word) => ({
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
            console.error('   ❌ 批次插入失败:', insertError.message);
        } else {
            insertedCount += batch.length;
            process.stdout.write('\r   📥 已导入: ' + insertedCount + '/' + words.length);
        }
    }

    console.log('\n   ✅ 导入完成: ' + insertedCount + '/' + words.length + ' 个单词');
    return { success: true, bookId: book.id, importedCount: insertedCount };
}

async function main() {
    console.log('🚀 导入商务词汇');
    await importVocabBook('business-vocabulary.json', {
        title: '商务词汇',
        category: '商务英语',
        cefrLevel: 'B2',
        description: '商务英语核心词汇表，涵盖职场、商业、金融等领域高频词汇'
    });
    console.log('\n✅ 导入完成!');
}

main().catch(console.error);
