import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.steen.fit";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site}/welcome`, lastModified: now, changeFrequency: "weekly", priority: 1, alternates: { languages: { en: `${site}/welcome`, da: `${site}/da` } } },
    { url: `${site}/da`, lastModified: now, changeFrequency: "weekly", priority: 0.9, alternates: { languages: { en: `${site}/welcome`, da: `${site}/da` } } },
    { url: `${site}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${site}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
