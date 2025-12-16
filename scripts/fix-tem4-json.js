const fs = require('fs');
let content = fs.readFileSync('data/tem4-vocabulary.json', 'utf-8');

// Add array brackets if missing
if (!content.trim().startsWith('[')) {
    content = '[' + content;
}
if (!content.trim().endsWith(']')) {
    content = content + ']';
}

// Fix missing commas between objects
content = content.replace(/\}\n\{/g, '},\n{');

fs.writeFileSync('data/tem4-vocabulary.json', content);

// Verify
try {
    const words = JSON.parse(content);
    console.log('✅ JSON 格式正确');
    console.log('📚 单词数量:', words.length);
    console.log('📖 书本ID:', words[0]?.bookId);
} catch (e) {
    console.log('❌', e.message);
}
