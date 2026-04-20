/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
    serverActions: {
      // Allow larger request bodies (batches of 5 JPEG pages can still be ~5-10MB)
      bodySizeLimit: '20mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
