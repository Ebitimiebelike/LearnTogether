import type { MetadataRoute } from "next";

/**
 * The web app manifest. Together with the service worker this is what lets the
 * tablet install LearnTogether to the home screen and run it offline.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LearnTogether",
    short_name: "LearnTogether",
    description:
      "Letters, numbers and tracing practice. Works offline, with no ads and no account.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f6f3",
    theme_color: "#2557c7",
    categories: ["education", "kids"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
