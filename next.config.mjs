/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["e2b.app", "*.e2b.app", "localhost"],
  images: { unoptimized: true },
};

export default nextConfig;
