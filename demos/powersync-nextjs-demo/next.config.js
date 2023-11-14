const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    { handler: 'CacheFirst', urlPattern: '/views/todo-lists' },
    { handler: 'CacheFirst', urlPattern: '/views/sql-console' }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: false
});

module.exports = nextConfig;
