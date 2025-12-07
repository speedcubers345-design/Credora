import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding", "porto", "@coinbase/wallet-sdk", "@gemini-wallet/core");
    return config;
  },
};

export default nextConfig;
