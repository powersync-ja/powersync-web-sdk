/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // TODO fix this
      'wa-sqlite/src/types': '@journeyapps/powersync-sdk-web'
    };
    return config;
  }
};

module.exports = nextConfig;
