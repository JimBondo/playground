import type { NextConfig } from "next";

// Deploy as a static export mounted under /floor-plan-designer/ on the
// same origin as the Playground landing page. If you instead deploy the
// sub-app to its own Vercel project, drop `basePath` + `output`.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/floor-plan-designer",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
