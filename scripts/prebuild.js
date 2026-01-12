#!/usr/bin/env node

/**
 * 构建前脚本：在 Vercel 构建时临时排除 data 目录
 * 避免超过 Vercel 250MB 限制
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'src', 'data');
const dataBackupDir = path.join(process.cwd(), 'data.backup');

// 只在 Vercel 环境中执行（有 VERCEL 环境变量）
if (process.env.VERCEL === '1' || process.env.CI) {
  console.log('🔧 Vercel 构建环境 detected，临时排除 data 目录...');

  if (fs.existsSync(dataDir)) {
    // 重命名 data 目录为 data.backup
    try {
      fs.renameSync(dataDir, dataBackupDir);
      console.log('✅ data 目录已临时重命名为 data.backup');
    } catch (error) {
      console.error('❌ 重命名 data 目录失败:', error);
      process.exit(1);
    }
  }
} else {
  console.log('ℹ️  本地构建环境，保留 data 目录');
}










