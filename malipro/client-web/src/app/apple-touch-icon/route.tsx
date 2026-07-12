import { ImageResponse } from "next/og";

// Icône iOS (apple-touch-icon) 180×180 PNG — route dynamique (évite l'échec de
// prérendu offline des fichiers-conventions metadata). Rouge plein, iOS arrondit.
export const dynamic = "force-dynamic";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E53935",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, color: "#fff", letterSpacing: -4 }}>N</div>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
