import { siteConfig } from "@/lib/site-config"

function QGlyph({ size = 560 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.214)}
      viewBox="0 0 1586 1925"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="q-preview-gradient" x1="236" y1="180" x2="1390" y2="1720">
          <stop offset="0" stopColor="#d5b8ff" />
          <stop offset="0.42" stopColor="#74a8ff" />
          <stop offset="0.72" stopColor="#29d4f0" />
          <stop offset="1" stopColor="#1672ff" />
        </linearGradient>
      </defs>
      <g transform="translate(-1498 -288)">
        <path
          d="M1505.5 1172C1505.5 686.266 1843.08 292.5 2259.5 292.5 2675.92 292.5 3013.5 686.266 3013.5 1172 3013.5 1657.73 2675.92 2051.5 2259.5 2051.5 1843.08 2051.5 1505.5 1657.73 1505.5 1172ZM1788.23 1172C1788.23 1501.58 1999.23 1768.77 2259.5 1768.77 2519.77 1768.77 2730.77 1501.58 2730.77 1172 2730.77 842.416 2519.77 575.235 2259.5 575.235 1999.23 575.235 1788.23 842.416 1788.23 1172Z"
          fill="url(#q-preview-gradient)"
          fillRule="evenodd"
        />
        <path
          d="M2641.65 1932.52 2812.77 1769.02 3075.54 2044.02 2904.43 2207.52Z"
          fill="url(#q-preview-gradient)"
          fillRule="nonzero"
        />
      </g>
    </svg>
  )
}

export function SocialPreviewCard() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#020304",
        color: "#f3f7fb",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          display: "flex",
          left: -220,
          top: -190,
          width: 760,
          height: 760,
          borderRadius: 760,
          background:
            "radial-gradient(circle, rgba(35, 213, 231, 0.34) 0%, rgba(13, 81, 96, 0.2) 36%, rgba(2, 3, 4, 0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          right: -250,
          bottom: -260,
          width: 760,
          height: 760,
          borderRadius: 760,
          background:
            "radial-gradient(circle, rgba(184, 65, 212, 0.38) 0%, rgba(71, 23, 97, 0.24) 38%, rgba(2, 3, 4, 0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          inset: 28,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />

      <div
        style={{
          position: "absolute",
          display: "flex",
          left: 74,
          top: -58,
          opacity: 0.95,
        }}
      >
        <QGlyph size={555} />
      </div>

      <div
        style={{
          position: "absolute",
          right: 70,
          top: 78,
          width: 500,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "rgba(224,242,249,0.58)",
            fontSize: 20,
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          Quanta Talent
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 52,
            fontSize: 58,
            lineHeight: 1.03,
            letterSpacing: -1,
            fontWeight: 500,
          }}
        >
          Exceptional people surface exceptional companies.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            width: 438,
            color: "rgba(230,238,243,0.72)",
            fontSize: 25,
            lineHeight: 1.35,
          }}
        >
          {siteConfig.shortDescription}
        </div>
        <div
          style={{
            marginTop: 46,
            display: "flex",
            gap: 12,
          }}
        >
          {["Future Founders", "Venture Scouts", "0.01% Talent"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 999,
                color: "rgba(231,239,245,0.68)",
                fontSize: 14,
                letterSpacing: 2.4,
                padding: "10px 14px",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          display: "flex",
          left: 70,
          bottom: 56,
          color: "rgba(229,242,248,0.45)",
          fontSize: 17,
          letterSpacing: 5,
          textTransform: "uppercase",
        }}
      >
        {siteConfig.url.replace(/^https?:\/\//, "")}
      </div>
    </div>
  )
}

export function AppIcon({ glyphSize = 128 }: { glyphSize?: number }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#020304",
      }}
    >
      <div
        style={{
          position: "absolute",
          display: "flex",
          inset: -34,
          borderRadius: 999,
          background:
            "radial-gradient(circle at 42% 28%, rgba(184, 91, 255, 0.7), rgba(42, 207, 236, 0.45) 38%, rgba(2, 3, 4, 0) 72%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", transform: "translateY(4%)" }}>
        <QGlyph size={glyphSize} />
      </div>
    </div>
  )
}
