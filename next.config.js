/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",

  basePath: "/gurukul-library",
  assetPrefix: "/gurukul-library/",

  trailingSlash: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;