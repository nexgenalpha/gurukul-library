/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,

  basePath: "/gurukul-library",
  assetPrefix: "/gurukul-library/",

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
},

module.exports = nextConfig;
