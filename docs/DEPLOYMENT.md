# ENGRAM 部署指南

本指南将帮助您将 ENGRAM 项目部署到生产环境。

## 前置要求

- Node.js 20.x
- Supabase 项目（用于数据库和认证）
- DeepSeek API 密钥（用于 AI 生成卡片）
- GitHub 账户（用于 Vercel 部署）

## 部署步骤

### 1. 准备 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 在项目设置中获取以下信息：
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) - 可选，用于管理功能

3. 运行数据库迁移：
   ```bash
   # 在 Supabase Dashboard 的 SQL Editor 中运行以下迁移文件
   # supabase/migrations/20241216_vocab_tables.sql
   # supabase/migrations/20241216_vocab_rls_fix.sql
   ```

### 2. 获取 API 密钥

#### DeepSeek API 密钥（必需）
1. 访问 [DeepSeek](https://platform.deepseek.com) 注册账户
2. 创建 API 密钥
3. 保存密钥用于后续配置

#### Gemini API 密钥（可选，用于 TTS）
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建 API 密钥

#### ElevenLabs API 密钥（可选，用于高级 TTS）
1. 访问 [ElevenLabs](https://elevenlabs.io)
2. 注册并获取 API 密钥

### 3. 部署到 Vercel（推荐）

#### 方法一：通过 Vercel Dashboard

1. **连接 GitHub 仓库**
   - 访问 [Vercel](https://vercel.com)
   - 使用 GitHub 账户登录
   - 点击 "New Project"
   - 导入您的 GitHub 仓库

2. **配置项目设置**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (默认)
   - **Build Command**: `npm run build` (或 `pnpm build`)
   - **Output Directory**: `.next` (Next.js 默认)
   - **Install Command**: `npm install` (或 `pnpm install`)

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：

   **必需变量：**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

   **可选变量：**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 访问提供的 URL 查看您的应用

#### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **在项目根目录部署**
   ```bash
   cd /Users/lusouldepth/Apps/ENGRAM
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add DEEPSEEK_API_KEY
   # ... 添加其他环境变量
   ```

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

### 4. 配置 Supabase 认证回调 URL

部署完成后，需要在 Supabase 中配置认证回调 URL：

1. 进入 Supabase Dashboard
2. 导航到 **Authentication** > **URL Configuration**
3. 添加以下 URL：
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**` (用于通配符匹配)

### 5. 验证部署

1. 访问您的应用 URL
2. 测试用户注册/登录功能
3. 测试卡片创建功能
4. 检查控制台是否有错误

## 其他部署平台

### Netlify

1. 连接 GitHub 仓库到 Netlify
2. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `.next`
3. 添加环境变量（同 Vercel）
4. 注意：需要配置 `netlify.toml` 以支持 Next.js

### Railway

1. 在 Railway 创建新项目
2. 连接 GitHub 仓库
3. 添加环境变量
4. Railway 会自动检测 Next.js 并配置

### 自托管（Docker）

1. 构建 Docker 镜像：
   ```bash
   docker build -t engram-app .
   ```

2. 运行容器：
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your_url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
     -e DEEPSEEK_API_KEY=your_key \
     engram-app
   ```

## 故障排除

### 构建失败

- 检查 Node.js 版本是否为 20.x
- 确保所有依赖都已安装
- 检查环境变量是否正确配置

### 认证问题

- 验证 Supabase 回调 URL 配置
- 检查环境变量中的 Supabase URL 和密钥
- 查看浏览器控制台和 Vercel 日志

### API 调用失败

- 验证 API 密钥是否正确
- 检查 API 配额和限制
- 查看 Vercel 函数日志

## 性能优化

1. **启用 Vercel Analytics**（可选）
2. **配置 CDN 缓存**
3. **优化图片和字体加载**
4. **监控 API 使用情况**

## 安全建议

1. **永远不要提交 `.env` 文件到 Git**
2. **使用环境变量管理敏感信息**
3. **定期轮换 API 密钥**
4. **启用 Supabase RLS（行级安全）**
5. **配置 CORS 策略**

## 持续部署

配置完成后，每次推送到主分支都会自动触发部署。您可以在 Vercel Dashboard 中查看部署历史和日志。

## 支持

如有问题，请查看：
- [Next.js 文档](https://nextjs.org/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)

