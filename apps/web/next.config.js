/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        // In production, NEXT_PUBLIC_API_URL should be set to the backend URL
        // (e.g., Railway, Render, etc.)
        // In development, proxy to localhost
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return [
            {
                source: '/api/:path*',
                destination: `${apiUrl}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
