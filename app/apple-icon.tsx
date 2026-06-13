import { ImageResponse } from "next/og"
import { AppIcon } from "@/lib/social-preview"

export const size = {
  width: 180,
  height: 180,
}
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(<AppIcon glyphSize={154} />, size)
}
