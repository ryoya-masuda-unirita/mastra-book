import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // リバースプロキシ下（GitHub Codespaces等）で
      // Server Action の CSRF オリジンチェックを通すための許可オリジン
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;
