/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['telegraf'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
