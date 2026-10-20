import type { NextConfig } from "next";

/* the retired pitch concepts (recoverable from the `pitch-archive` git
   tag) and the old /passport route all land on the homepage */
const RETIRED_ROUTES = ["/passport", "/pixel", "/toile", "/fieldnotes", "/dither", "/still"];

const nextConfig: NextConfig = {
  /* the partner route reads decks/<format>.pdf by computed path, which
     file tracing can't see — without this the PDFs never reach Vercel */
  outputFileTracingIncludes: {
    "/api/partner": ["./decks/**/*.pdf"],
  },
  async redirects() {
    return RETIRED_ROUTES.map((source) => ({
      source,
      destination: "/",
      permanent: true,
    }));
  },
};

export default nextConfig;
