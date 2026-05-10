/** @type {import('next').NextConfig} */
const nextConfig = {
  // /fms-proxy/* is handled by the App Router catch-all route handler at
  // app/fms-proxy/[...path]/route.ts which runs in the Node.js runtime
  // (full DNS resolution, all HTTP methods).
}

export default nextConfig
