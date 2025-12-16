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
    webpack: (config, { isServer }) => {
        if (isServer) {
            // 在服务器端构建时排除 data 目录下的 JSON 文件
            config.externals = config.externals || [];
            config.externals.push({
                'fs/promises': 'commonjs fs/promises',
            });
        }
        return config;
    },
};

export default nextConfig;
