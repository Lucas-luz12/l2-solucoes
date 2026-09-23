/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita falha de next.config.ts no ambiente de build da Hostinger
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
