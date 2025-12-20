#!/bin/bash

# 清理可能的进程
echo "🔍 检查并清理旧进程..."
pkill -f "next dev" 2>/dev/null
sleep 2

# 检查端口
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  端口 3000 被占用，正在释放..."
    kill -9 $(lsof -ti:3000) 2>/dev/null
    sleep 2
fi

# 修复 .env.local 权限（如果需要）
if [ -f .env.local ]; then
    echo "🔧 修复 .env.local 权限..."
    chmod 644 .env.local
    # 移除扩展属性（macOS 特有）
    xattr -c .env.local 2>/dev/null || true
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
echo "📍 访问地址: http://localhost:3000"
echo ""

pnpm dev

