import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // 将数据库相关包标记为外部包，避免在构建时尝试预渲染
  serverExternalPackages: ['pg', '@supabase/supabase-js', 'drizzle-orm', 'bcrypt'],
};

export default nextConfig;
