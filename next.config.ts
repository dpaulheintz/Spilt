import type { NextConfig } from "next";

/* the retired pitch concepts (recoverable from the `pitch-archive` git
   tag) and the old /passport route all land on the homepage */
const RETIRED_ROUTES = ["/passport", "/pixel", "/toile", "/fieldnotes", "/dither", "/still"];

const nextConfig: NextConfig = {
  async redirects() {
    return RETIRED_ROUTES.map((source) => ({
      source,
      destination: "/",
      permanent: true,
    }));
  },
};

export default nextConfig;
