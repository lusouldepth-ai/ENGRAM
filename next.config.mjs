/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // 启用 standalone 输出模式以支持 Docker 部署
    output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
    // 排除大型 JSON 文件，避免超过 Vercel 250MB 限制
    experimental: {
        outputFileTracingExcludes: {
            '*': [
                './data/**/*.json',
                './data/*.json',
            ],
        },
    },
};

export default nextConfig;
