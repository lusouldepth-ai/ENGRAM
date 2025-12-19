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
    compiler: {
        // 移除 console.log 在生产环境
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },
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
