
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  eslint: {
    // Keep linting enabled for production quality
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks']
  },
  typescript: {
    // Enable TypeScript checking for production safety
    ignoreBuildErrors: false,
  },
  images: {
    // Enable optimization for production
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['vercel.app', 'github.com', 'githubusercontent.com']
  },
  // Production optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },
  webpack: (config, { isServer }) => {
    // Fix for @react-native-async-storage/async-storage in MetaMask SDK
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

export default nextConfig
