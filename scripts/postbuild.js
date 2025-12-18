#!/usr/bin/env node

/**
 * 构建后脚本：恢复 data 目录
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'src', 'data');
const dataBackupDir = path.join(process.cwd(), 'data.backup');

// 只在 Vercel 环境中执行
if (process.env.VERCEL === '1' || process.env.CI) {
  if (fs.existsSync(dataBackupDir)) {
    try {
      fs.renameSync(dataBackupDir, dataDir);
      console.log('✅ data 目录已恢复');
    } catch (error) {
      console.error('❌ 恢复 data 目录失败:', error);
    }
  }
}

