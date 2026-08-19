import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['tldraw', '@tldraw/editor', '@tldraw/store', '@tldraw/utils', '@tldraw/validate', '@tldraw/tlschema'],
  async rewrites() {
    const isDev = process.env.NODE_ENV === 'development';
    const backendUrl = isDev ? 'http://localhost:3000/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'https://neet-saas.onrender.com/api/v1');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/:path*`,
      },
    ];
  },
};

export default nextConfig;
