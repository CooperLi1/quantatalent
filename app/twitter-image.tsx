import { ImageResponse } from "next/og"
import { SocialPreviewCard } from "@/lib/social-preview"
import { socialPreview } from "@/lib/site-config"

export const alt = socialPreview.alt
export const size = {
  width: socialPreview.width,
  height: socialPreview.height,
}
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(<SocialPreviewCard />, size)
}
