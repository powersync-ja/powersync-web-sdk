const { default: _withPWA, runtimeCaching } = require('@ducanh2912/next-pwa');

const withPWA = _withPWA({
  dest: 'public',
  cacheStartUrl: true,
  dynamicStartUrl: '/views/todo-lists',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'service-worker',
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: []
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: false
});

module.exports = nextConfig;
