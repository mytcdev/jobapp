import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobApp – Find Your Next Role",
    short_name: "JobApp",
    description: "Smart job portal with skill matching",
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
