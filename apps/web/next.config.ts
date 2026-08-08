import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['tldraw', '@tldraw/editor', '@tldraw/store', '@tldraw/utils', '@tldraw/validate', '@tldraw/tlschema'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
