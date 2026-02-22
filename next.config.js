/** @type {import('next').NextConfig} */
const nextConfig = {
  telemetry: false,
  eslint: {
    ignoreDuringBuilds: true,   // prevents ESLint version mismatch from failing build
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};
module.exports = nextConfig;
