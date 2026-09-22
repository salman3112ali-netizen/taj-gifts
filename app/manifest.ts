import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Taj Gifts — hand-tied gift hampers, Kashipur (Uttarakhand)",
    short_name: "Taj Gifts",
    description: "Pastel-perfect gift hampers hand-tied at home in Kashipur, Uttarakhand. Festive, wedding, baby, corporate & pahadi hampers. COD & UPI.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7ef",
    theme_color: "#fbf7ef",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logo-emblem.png", sizes: "any", type: "image/png", purpose: "any" },
      { src: "/logo-emblem.png", sizes: "any", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop hampers", url: "/app/shop" },
      { name: "Your basket", url: "/app/cart" },
      { name: "Search", url: "/app/search" },
    ],
  };
}
