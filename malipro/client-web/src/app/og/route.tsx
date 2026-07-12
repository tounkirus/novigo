import { ImageResponse } from "next/og";

// Image Open Graph / Twitter (1200×630 PNG) — route dynamique.
export const dynamic = "force-dynamic";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 90px",
          background: "#0F1117",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#E53935",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 78,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            N
          </div>
          <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: 2 }}>NOVIGO</div>
        </div>
        <div style={{ fontSize: 46, marginTop: 36, color: "#FFFFFF", fontWeight: 600 }}>La Super App du Mali</div>
        <div style={{ fontSize: 30, marginTop: 16, color: "#B8BDC9" }}>
          Livraison · Transport · Services · Paiements
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
