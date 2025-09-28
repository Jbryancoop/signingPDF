/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle PDF.js canvas issues by providing fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }

    // Exclude problematic PDF.js modules from server-side rendering
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('canvas');
    }

    return config;
  },
  // Enable experimental features for better PDF.js compatibility
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
