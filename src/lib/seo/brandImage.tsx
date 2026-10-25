import { ImageResponse } from "next/og";

const INDIGO = "#4f46e5";

/** Zajednička slika za Open Graph i Twitter: naziv FICO na indigo pozadini. */
export function renderBrandImage(width: number, height: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: INDIGO,
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 220, fontWeight: 800, letterSpacing: -6, lineHeight: 1 }}>FICO</div>
        <div style={{ fontSize: 52, marginTop: 28, opacity: 0.9 }}>Find Co-Founder za Balkan</div>
      </div>
    ),
    { width, height },
  );
}
