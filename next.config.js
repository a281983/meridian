/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // config/*.yaml and data/*.json are read from disk at runtime. On Vercel,
  // serverless functions only ship files the tracer can see — dynamic fs reads
  // aren't detected — so bundle these explicitly or the dashboard/apply routes
  // 500 in production (the static landing page never touches them, so it works
  // regardless and can mask this).
  // Both keys so every route depth matches (picomatch: "/*" = one segment,
  // "/**" = any depth like /opportunity/[id] and /api/memo/[id]).
  outputFileTracingIncludes: {
    "/*": ["./config/**/*", "./data/**/*"],
    "/**": ["./config/**/*", "./data/**/*"],
  },
};

module.exports = nextConfig;
