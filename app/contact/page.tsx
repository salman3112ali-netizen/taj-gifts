import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import ContactClient from "./contact-client";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const metadata: Metadata = {
  title: "Contact & Custom Hampers — WhatsApp Taj Gifts Kashipur",
  description:
    "WhatsApp or call Taj Gifts, Kashipur (Uttarakhand) for custom gift hampers, wedding return-gift trays and corporate bulk quotes. Replies within the hour, 10 am–8 pm IST.",
  alternates: { canonical: BASE + "/contact" },
};

export default async function Contact() {
  const settings = await getSettings();
  return <ContactClient settings={settings} />;
}
