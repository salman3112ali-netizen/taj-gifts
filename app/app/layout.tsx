import type { Metadata } from "next";
import AppTabBar from "@/components/app/tabbar";

export const metadata: Metadata = {
  title: "Taj Gifts App",
  description: "The Taj Gifts mobile app — browse, search and order hand-tied hampers.",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[560px] bg-cream pb-[calc(60px+env(safe-area-inset-bottom))]">
      {children}
      <AppTabBar />
    </div>
  );
}
