const withImages = require('next-images');
const path = require('path');

module.exports = withImages({
  images: {
    disableStaticImages: true
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    if (isServer) {
      return config;
    }
    return {
      ...config,
      module: {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
          }
        ]
      }
    };
  }
});
