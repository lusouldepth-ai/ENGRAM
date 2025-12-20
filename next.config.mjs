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
    // SWC 编译优化
    // 注意：removeConsole 在 Turbopack 模式下不支持
    // 开发模式使用 Turbopack，所以不设置此选项；生产环境构建时会自动应用
    ...(process.env.NODE_ENV === 'production' ? {
        compiler: {
            removeConsole: {
                exclude: ['error', 'warn'],
            },
        },
    } : {}),
    // 实验性优化
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            'framer-motion', // Tree-shake unused motion components
        ],
        outputFileTracingExcludes: {
            '*': [
                './data/**/*.json',
                './data/*.json',
            ],
        },
    },
    // 资源优化
    images: {
        formats: ['image/avif', 'image/webp'],
    },
};

export default nextConfig;
