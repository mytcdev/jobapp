import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KareerHub — Smarter Matching. Better Careers.",
    short_name: "KareerHub",
    description: "Smarter job matching. Better careers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
