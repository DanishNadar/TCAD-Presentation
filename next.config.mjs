/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: deploys to Vercel as-is and also runs from any static host / USB stick.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
  // Set NEXT_PUBLIC_BASE_PATH only if hosting under a sub-path (e.g. GitHub Pages).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  trailingSlash: true,
};

export default nextConfig;
