import { ImageResponse } from "next/og"
import { AppIcon } from "@/lib/social-preview"

export const size = {
  width: 64,
  height: 64,
}
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(<AppIcon glyphSize={54} />, size)
}
