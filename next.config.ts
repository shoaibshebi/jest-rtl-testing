import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // msw ships some deps (e.g. rettime) as ESM-only, which breaks Jest's
  // CJS require unless Next transpiles them for the test transform.
  transpilePackages: [
    "msw",
    "rettime",
    "@open-draft/deferred-promise",
    "headers-polyfill",
    "until-async",
  ],
};

export default nextConfig;
