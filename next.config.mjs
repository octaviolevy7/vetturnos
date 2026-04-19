/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "pg",
      "@prisma/adapter-pg",
      "@prisma/client",
    ],
  },
};

export default nextConfig;
