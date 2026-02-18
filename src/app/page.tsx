export default function Home() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: "calc(100svh - 60px)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Ambient radial glow — right side */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "5%",
          top: "50%",
          transform: "translateY(-50%)",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle at center, rgba(232,146,15,0.09) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(20px)",
        }}
      />

      {/* Decorative vinyl disc — right, partially off-screen */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "-18%",
          top: "50%",
          transform: "translateY(-50%)",
          width: 680,
          height: 680,
          opacity: 0.13,
          pointerEvents: "none",
        }}
      >
        <div
          className="vinyl-disc spin-record"
          style={{ width: "100%", height: "100%", animationDuration: "28s" }}
        />
      </div>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "4rem 2.5rem",
        }}
      >
        {/* Eyebrow tag */}
        <p
          className="font-mono fade-up"
          style={{
            fontSize: 10,
            letterSpacing: "0.35em",
            color: "var(--amber)",
            textTransform: "uppercase",
            marginBottom: "2rem",
            animationDelay: "0ms",
          }}
        >
          ◆&nbsp;&nbsp;Audio Recognition × Discogs
        </p>

        {/* Hero headline */}
        <h1
          className="font-display fade-up"
          style={{
            fontSize: "clamp(70px, 11vw, 138px)",
            lineHeight: 0.88,
            color: "var(--cream)",
            marginBottom: "2.5rem",
            animationDelay: "80ms",
            letterSpacing: "-0.02em",
          }}
        >
          Discogs
          <br />
          <span style={{ color: "var(--amber)" }}>Finder</span>
        </h1>

        {/* Tagline */}
        <p
          className="font-body fade-up"
          style={{
            fontSize: "clamp(16px, 1.8vw, 21px)",
            lineHeight: 1.65,
            color: "var(--cream-2)",
            fontStyle: "italic",
            maxWidth: 400,
            marginBottom: "3rem",
            animationDelay: "160ms",
          }}
        >
          Hear a record spinning. Find the exact pressing.
          Add it to your Discogs collection in seconds.
        </p>

        {/* CTA */}
        <div className="fade-up" style={{ animationDelay: "240ms", display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/api/auth/discogs" className="cta-primary">
            Connect with Discogs
          </a>
          <span
            style={{ color: "var(--amber)", fontSize: 22, lineHeight: 1 }}
            aria-hidden
          >
            →
          </span>
        </div>

        {/* Three steps */}
        <div
          className="fade-up"
          style={{
            marginTop: "4.5rem",
            paddingTop: "2.5rem",
            borderTop: "1px solid var(--ink-border)",
            display: "flex",
            gap: "clamp(24px, 5vw, 56px)",
            animationDelay: "320ms",
          }}
        >
          {[
            { n: "01", label: "Listen via mic" },
            { n: "02", label: "Find on Discogs" },
            { n: "03", label: "Add to collection" },
          ].map(({ n, label }) => (
            <div key={n}>
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: "var(--amber)",
                  letterSpacing: "0.18em",
                  marginBottom: 7,
                  textTransform: "uppercase",
                }}
              >
                {n}
              </div>
              <div style={{ fontSize: 13, color: "var(--cream-2)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
