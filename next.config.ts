import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Triggering restart for Prisma Update
  reactCompiler: true,
};

export default nextConfig;
