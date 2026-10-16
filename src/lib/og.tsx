import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Zajednički izgled slika za dijeljenje (Facebook, WhatsApp, Viber, X):
// tamna tinta, kartica termina sa šafran vremenom – isti motiv kao u aplikaciji.

export const ogSize = { width: 1200, height: 630 };

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/bricolage-grotesque-latin-700-normal.woff")),
  readFile(join(process.cwd(), "assets/bricolage-grotesque-latin-ext-700-normal.woff")),
]);

export async function renderOg({
  eyebrow,
  title,
  subtitle,
  brand = "#0f6b5c",
  time = "14:30",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  brand?: string;
  time?: string;
}) {
  const [latin, latinExt] = await fonts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#13212e",
          color: "#f3f6f7",
          fontFamily: "Bricolage, BricolageExt",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 24, height: 14, borderRadius: 4, background: "#f4b93e" }} />
            </div>
            <div style={{ fontSize: 34, letterSpacing: -0.5 }}>{eyebrow}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: title.length > 28 ? 64 : 80, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
            <div style={{ fontSize: 30, color: "#93a1ac", lineHeight: 1.3 }}>{subtitle}</div>
          </div>
        </div>
        <div
          style={{
            width: 330,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transform: "rotate(-3deg)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", background: "#f3f6f7", color: "#13212e", borderRadius: 28, padding: 36 }}>
            <div style={{ fontSize: 22, color: "#5b6875" }}>Vaš termin</div>
            <div
              style={{
                marginTop: 18,
                display: "flex",
                alignSelf: "flex-start",
                background: "#f4b93e",
                color: "#2a1d00",
                borderRadius: 16,
                padding: "6px 18px",
                fontSize: 84,
                letterSpacing: -2,
              }}
            >
              {time}
            </div>
            <div style={{ marginTop: 28, borderTop: "3px dashed #dde4e8", paddingTop: 22, fontSize: 22, color: "#5b6875", display: "flex" }}>
              Potvrda stiže na WhatsApp
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Bricolage", data: latin, weight: 700, style: "normal" },
        { name: "BricolageExt", data: latinExt, weight: 700, style: "normal" },
      ],
    },
  );
}
