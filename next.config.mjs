import path from 'path'
import { fileURLToPath } from 'url'

/** Absolute app root — keeps Turbopack/env resolution inside this folder (not a parent like `~/package.json`). */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Force `tailwindcss` to resolve here even when CSS import context is the parent folder. */
const tailwindRoot = path.join(__dirname, 'node_modules', 'tailwindcss')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      tailwindcss: tailwindRoot,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: tailwindRoot,
    }
    return config
  },
}

export default nextConfig
