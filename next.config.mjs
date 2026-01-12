/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Experimental optimizations
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
    },
};

export default nextConfig;
