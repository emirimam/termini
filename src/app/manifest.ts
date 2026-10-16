import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Termini",
    short_name: "Termini",
    description: "Kalendar i online zakazivanje za salone i ordinacije",
    start_url: "/app",
    display: "standalone",
    background_color: "#f3f6f7",
    theme_color: "#0f6b5c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
