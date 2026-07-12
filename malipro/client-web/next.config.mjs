/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sortie autonome pour une image Docker minimale (serveur Node embarqué).
  output: "standalone",
  images: {
    // Cache les images optimisées 31 jours : une source lente/instable (loremflickr)
    // n'est sollicitée qu'une fois par visuel, puis servie depuis le cache.
    minimumCacheTTL: 2_678_400,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "loremflickr.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};
export default nextConfig;
