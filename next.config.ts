// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  productionBrowserSourceMaps: true,

  images: {
    domains: [],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    optimizeCss: false, // disable lightningcss
  },

  // Force Tailwind to use JS instead of native oxide
  env: {
    TAILWIND_MODE: "watch",
    TAILWIND_DISABLE_NATIVE: "true",
  },
};

export default nextConfig;
