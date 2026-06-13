const fallbackUrl = "https://quantatalent.vercel.app"

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

export const siteConfig = {
  name: "Quanta Talent",
  title: "Quanta Talent · Venture Intelligence",
  description:
    "Join the AI-native venture intelligence community for future founders, venture scouts, and top 0.01% exceptional talent.",
  shortDescription:
    "An AI-native venture intelligence community for future founders, scouts, and exceptional operators.",
  url: normalizeUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : fallbackUrl)
  ),
  keywords: [
    "Quanta",
    "Quanta Talent",
    "venture intelligence",
    "AI community",
    "venture scouts",
    "future founders",
    "exceptional talent",
    "startup talent",
  ],
} as const

export const socialPreview = {
  alt:
    "Quanta Talent preview card with a glowing Q and text for future founders, venture scouts, and exceptional talent.",
  width: 1200,
  height: 630,
} as const
