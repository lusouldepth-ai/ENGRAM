# Vercel 快速部署指南

## 🚀 快速开始

### 方法一：通过 Vercel Dashboard（推荐，最简单）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账户登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择 `lusouldepth-ai/ENGRAM` 仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）
   - **Install Command**: `npm install`（默认）

4. **配置环境变量** ⚠️ **重要！**
   
   在 "Environment Variables" 部分添加以下变量：

   **必需的环境变量：**
   ```
   NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key
   DEEPSEEK_API_KEY=你的_deepseek_api_key
   ```

   **可选的环境变量：**
   ```
   SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
   GEMINI_API_KEY=你的_gemini_api_key
   NEXT_PUBLIC_GEMINI_API_KEY=你的_gemini_api_key
   ELEVENLABS_API_KEY=你的_elevenlabs_api_key
   ```

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常 2-5 分钟）
   - 部署完成后会获得一个 URL，例如：`https://engram-xxx.vercel.app`

6. **配置 Supabase 回调 URL**
   - 进入 Supabase Dashboard
   - 导航到 **Authentication** → **URL Configuration**
   - 在 **Redirect URLs** 中添加：
     ```
     https://你的应用域名.vercel.app/auth/callback
     https://你的应用域名.vercel.app/**
     ```
   - 在 **Site URL** 中设置：`https://你的应用域名.vercel.app`

### 方法二：通过 Vercel CLI

1. **确保代码已提交并推送**
   ```bash
   git add .
   git commit -m "准备部署到 Vercel"
   git push origin working-branch
   ```

2. **在项目目录运行部署命令**
   ```bash
   vercel --prod
   ```

3. **首次部署需要配置**
   - 选择项目范围（个人或团队）
   - 确认项目设置
   - 添加环境变量（或稍后在 Dashboard 添加）

4. **后续更新**
   - 每次推送代码到主分支会自动触发部署
   - 或手动运行 `vercel --prod`

## 📋 环境变量说明

### 如何获取这些密钥？

#### Supabase 密钥
1. 访问 https://supabase.com
2. 进入您的项目
3. 点击 **Settings** → **API**
4. 复制：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（可选）

#### DeepSeek API 密钥
1. 访问 https://platform.deepseek.com
2. 注册/登录账户
3. 进入 API Keys 页面
4. 创建新密钥并复制

#### Gemini API 密钥（可选）
1. 访问 https://makersuite.google.com/app/apikey
2. 创建 API 密钥
3. 复制密钥

## ✅ 部署后检查清单

- [ ] 应用可以正常访问
- [ ] 用户注册/登录功能正常
- [ ] Supabase 回调 URL 已配置
- [ ] 环境变量都已正确设置
- [ ] 卡片创建功能正常
- [ ] 没有控制台错误

## 🔧 常见问题

### 构建失败
- 检查 Node.js 版本（需要 20.x）
- 查看 Vercel 构建日志中的错误信息
- 确保所有依赖都已正确安装

### 认证问题
- 确认 Supabase 回调 URL 已配置
- 检查环境变量是否正确
- 查看浏览器控制台错误

### API 调用失败
- 验证 API 密钥是否正确
- 检查 API 配额是否用完
- 查看 Vercel 函数日志

## 📚 更多信息

详细部署文档请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

