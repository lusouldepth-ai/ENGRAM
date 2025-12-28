/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Optimize imports to reduce bundle size
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{lowerCase member}}',
        },
    },
    // Experimental optimizations
    experimental: {
        optimizePackageImports: ['framer-motion', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
    },
};

export default nextConfig;
