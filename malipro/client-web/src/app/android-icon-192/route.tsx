import { ImageResponse } from "next/og";

// Icône Android (PWA) 192×192, maskable — PNG générée au build.
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
        <div style={{ fontSize: 132, fontWeight: 800, color: "#fff", letterSpacing: -4 }}>N</div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
