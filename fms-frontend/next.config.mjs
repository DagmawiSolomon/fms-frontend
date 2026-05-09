/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/fms-proxy/:path*",
        destination: "https://fms-app-production-5b62.up.railway.app/:path*",
      },
    ]
  },
}

export default nextConfig
