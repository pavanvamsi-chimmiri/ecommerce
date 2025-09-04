import type { NextConfig } from "next";

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  ...(isVercel ? {} : { distDir: 'build' }),
};

export default nextConfig;
