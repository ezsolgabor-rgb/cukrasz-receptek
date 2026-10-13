import type { NextConfig } from "next";

// A LAN IP-t azért kell engedélyezni, hogy fejlesztői módban a telefonról
// (ugyanazon a Wi-Fi-n) is megnyitható legyen az app.
const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.123", "127.0.0.1", "localhost"],
  images: {
    // A feltöltött fotókat saját route-handler szolgálja ki, nem kell külső domain.
    remotePatterns: [],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
