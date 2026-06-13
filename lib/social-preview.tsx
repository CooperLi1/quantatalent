function QGlyph({ size = 560, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.214)}
      viewBox="0 0 1586 1925"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", opacity }}
    >
      <defs>
        <linearGradient id="q-preview-gradient" x1="236" y1="180" x2="1390" y2="1720">
          <stop offset="0" stopColor="#b9eaff" />
          <stop offset="0.32" stopColor="#70b7ff" />
          <stop offset="0.66" stopColor="#39d6ee" />
          <stop offset="1" stopColor="#2c66ff" />
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

function SmallLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        color: "rgba(234, 244, 249, 0.52)",
        fontSize: 18,
        letterSpacing: 7,
        lineHeight: 1,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  )
}

function SignalPill({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 42,
        border: "1px solid rgba(255,255,255,0.13)",
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.035)",
        color: "rgba(239,247,250,0.72)",
        fontSize: 15,
        letterSpacing: 3.2,
        padding: "0 17px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
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
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(4, 8, 10, 1) 0%, rgba(2, 3, 4, 0.82) 49%, rgba(2, 3, 4, 1) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          left: -260,
          top: 0,
          width: 740,
          height: 630,
          background:
            "linear-gradient(108deg, rgba(57, 214, 238, 0.18) 0%, rgba(57, 214, 238, 0.08) 28%, rgba(2, 3, 4, 0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          right: -80,
          bottom: 0,
          width: 620,
          height: 630,
          background:
            "linear-gradient(24deg, rgba(214, 93, 202, 0.16) 0%, rgba(37, 99, 235, 0.08) 34%, rgba(2, 3, 4, 0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          inset: 30,
          border: "1px solid rgba(255,255,255,0.105)",
          borderRadius: 2,
        }}
      />

      <div
        style={{
          position: "absolute",
          display: "flex",
          left: 58,
          top: 54,
          width: 1084,
          height: 522,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      <div
        style={{
          position: "absolute",
          display: "flex",
          left: 78,
          top: 70,
          width: 678,
          flexDirection: "column",
        }}
      >
        <SmallLabel>Quanta · Talent Community</SmallLabel>
        <div
          style={{
            display: "flex",
            marginTop: 52,
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "rgba(247,250,252,0.95)",
              fontSize: 72,
              fontWeight: 500,
              lineHeight: 0.96,
            }}
          >
            The people
          </div>
          <div
            style={{
              display: "flex",
              color: "rgba(247,250,252,0.95)",
              fontSize: 72,
              fontWeight: 500,
              lineHeight: 0.96,
            }}
          >
            who reach
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 4,
            }}
          >
            <span
              style={{
                color: "#54d6ef",
                fontSize: 88,
                fontWeight: 600,
                lineHeight: 0.94,
              }}
            >
              0.01%
            </span>
            <span
              style={{
                color: "rgba(247,250,252,0.95)",
                fontSize: 72,
                fontWeight: 500,
                lineHeight: 0.94,
                marginLeft: 18,
              }}
            >
              first.
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 34,
            width: 620,
            color: "rgba(229, 238, 243, 0.72)",
            fontSize: 24,
            lineHeight: 1.34,
          }}
        >
          Future founders, venture scouts, and exceptional operators surfaced
          before consensus forms.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          display: "flex",
          left: 78,
          bottom: 66,
          gap: 12,
        }}
      >
        <SignalPill>Future founders</SignalPill>
        <SignalPill>Venture scouts</SignalPill>
        <SignalPill>0.01% talent</SignalPill>
      </div>

      <div
        style={{
          position: "absolute",
          display: "flex",
          right: 76,
          bottom: 70,
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <SmallLabel>Venture intelligence</SmallLabel>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            color: "rgba(229,242,248,0.5)",
            fontSize: 17,
            letterSpacing: 4.5,
            textTransform: "uppercase",
          }}
        >
          quantatalent.vercel.app
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          display: "flex",
          right: 118,
          top: 80,
          width: 300,
          height: 360,
          flexDirection: "column",
          gap: 14,
          opacity: 0.36,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              width: 300 - i * 18,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.14)",
            }}
          />
        ))}
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
