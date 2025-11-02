/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Large limit to accommodate video file uploads
      // Consider implementing chunked upload for production
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;
