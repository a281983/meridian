/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // config/*.yaml and data/*.json are read from disk at runtime. On Vercel,
  // serverless functions only ship files the tracer can see — dynamic fs reads
  // aren't detected — so bundle these explicitly or the dashboard/apply routes
  // 500 in production (the static landing page never touches them, so it works
  // regardless and can mask this).
  outputFileTracingIncludes: {
    "/*": ["./config/**/*", "./data/**/*"],
  },
};

module.exports = nextConfig;
