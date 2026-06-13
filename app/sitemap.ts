import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

const lastModified = new Date("2026-06-13T00:00:00-04:00")

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ]
}
