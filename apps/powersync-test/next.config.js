/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // TODO fix this
      'wa-sqlite/src/types': 'react'
    };
    return config;
  }
};

module.exports = nextConfig;
