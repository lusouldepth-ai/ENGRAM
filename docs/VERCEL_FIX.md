# Vercel 部署问题修复指南

## 问题诊断

部署失败的原因是：**构建时环境变量未正确传递或值格式不正确**

错误信息：`Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.`

## 已完成的修复

1. ✅ 添加了环境变量验证（更好的错误提示）
2. ✅ 将客户端组件中的 Supabase 客户端创建延迟到运行时
3. ✅ 添加了 `revalidate = 0` 确保页面完全动态

## 需要检查的事项

### 1. 验证 Vercel 环境变量

请访问 Vercel Dashboard 并检查以下环境变量的值：

**必需检查：**
- `NEXT_PUBLIC_SUPABASE_URL` 
  - ✅ 应该以 `https://` 开头
  - ✅ 不应该有尾随斜杠 `/`
  - ✅ 不应该有空格
  - 示例：`https://xxxxx.supabase.co`

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - ✅ 应该是完整的密钥字符串
  - ✅ 不应该有空格或换行

- `DEEPSEEK_API_KEY`
  - ✅ 应该是有效的 API 密钥

### 2. 如何检查和修复

#### 方法一：通过 Vercel Dashboard

1. 访问 https://vercel.com
2. 进入您的项目 `engram`
3. 点击 **Settings** → **Environment Variables**
4. 检查每个变量的值
5. 如果值不正确，点击编辑并重新输入正确的值

#### 方法二：通过 CLI 检查

```bash
# 查看环境变量列表
vercel env ls

# 如果需要重新设置某个变量
vercel env rm NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 然后输入正确的值
```

### 3. 重新部署

修复环境变量后，需要重新部署：

```bash
# 提交代码更改
git add .
git commit -m "修复构建时 Supabase 客户端访问问题"
git push

# 或者直接触发重新部署
vercel --prod
```

## 验证部署

部署成功后，检查：

1. ✅ 构建日志中没有 Supabase URL 错误
2. ✅ 应用可以正常访问
3. ✅ 登录功能正常
4. ✅ 没有控制台错误

## 如果问题仍然存在

如果修复环境变量后仍然失败，请：

1. 检查 Vercel 构建日志的完整错误信息
2. 确认 Supabase 项目 URL 和密钥是否正确
3. 验证所有环境变量都已添加到 **Production** 环境

