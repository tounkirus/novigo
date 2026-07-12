import { ImageResponse } from "next/og";

// Icône Android (PWA) 512×512, maskable + splash — PNG générée au build.
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
        <div style={{ fontSize: 340, fontWeight: 800, color: "#fff", letterSpacing: -10 }}>N</div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
