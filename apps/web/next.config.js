/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : (process.env.STATIC_EXPORT === 'true' ? '/ip-addressing' : undefined),
};

module.exports = nextConfig;
