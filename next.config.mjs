/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: false,
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;
