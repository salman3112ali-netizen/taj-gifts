import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taj Gifts — hand-tied gift hampers, Kashipur (Uttarakhand)",
    short_name: "Taj Gifts",
    description: "Pastel-perfect gift hampers hand-tied at home in Kashipur, Uttarakhand. Festive, wedding, baby, corporate & pahadi hampers. COD & UPI.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7ef",
    theme_color: "#fbf7ef",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logo-emblem.png", sizes: "any", type: "image/png" },
    ],
  };
}
