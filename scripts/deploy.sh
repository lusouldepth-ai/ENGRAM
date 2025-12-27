#!/bin/bash

# ENGRAM 快速部署脚本
# 使用方法: ./scripts/deploy.sh [vercel|docker]

set -e

DEPLOY_TYPE=${1:-vercel}

echo "🚀 ENGRAM 部署脚本"
echo "=================="

if [ "$DEPLOY_TYPE" = "vercel" ]; then
    echo "📦 部署到 Vercel..."
    
    # 检查是否安装了 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI 未安装"
        echo "正在安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    # 检查是否已登录
    if ! vercel whoami &> /dev/null; then
        echo "🔐 请先登录 Vercel..."
        vercel login
    fi
    
    # 部署
    echo "🚀 开始部署..."
    vercel --prod
    
    echo "✅ 部署完成！"
    echo "💡 提示: 确保在 Vercel Dashboard 中配置了所有必需的环境变量"
    
elif [ "$DEPLOY_TYPE" = "docker" ]; then
    echo "🐳 使用 Docker 部署..."
    
    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 .env 文件
    if [ ! -f .env ]; then
        echo "⚠️  警告: 未找到 .env 文件"
        echo "请创建 .env 文件并配置必要的环境变量"
        echo "参考 .env.example 文件"
    fi
    
    # 构建镜像
    echo "🔨 构建 Docker 镜像..."
    DOCKER_BUILD=true docker build -t engram-app .
    
    # 运行容器
    echo "🚀 启动容器..."
    docker-compose up -d
    
    echo "✅ Docker 部署完成！"
    echo "🌐 应用运行在 http://localhost:3000"
    
else
    echo "❌ 未知的部署类型: $DEPLOY_TYPE"
    echo "使用方法: ./scripts/deploy.sh [vercel|docker]"
    exit 1
fi









