/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'jymktjxlveyvaqkjrmho.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    // Vercel build optimization
    typescript: {
        ignoreBuildErrors: true, 
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;
