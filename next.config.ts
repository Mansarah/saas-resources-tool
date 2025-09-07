/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
  
    qualities: [100], // Add any quality values you use, like 75, 80, 100, etc.
  },
}

export default nextConfig
