import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.steen.fit";

/** Public pages are crawlable; the signed-in app and the API are not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/welcome", "/da", "/pricing", "/terms", "/privacy", "/login"], disallow: ["/api/", "/admin", "/account", "/insights", "/auth/"] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
