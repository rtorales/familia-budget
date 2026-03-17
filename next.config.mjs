/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling native modules used only on the server
      config.externals = [...(config.externals ?? []), 'better-sqlite3']
    }
    return config
  },
}

export default nextConfig
