const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheStartUrl: true,
  dynamicStartUrl: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: false
});

module.exports = nextConfig;
