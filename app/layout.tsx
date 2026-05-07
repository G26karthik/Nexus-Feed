import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Feed — Your Personalized Interest Digest",
  description:
    "Define your interests through an AI-generated infinite drill-down taxonomy. Receive a clean daily digest of what happened in each area — summaries + source links, no noise.",
  openGraph: {
    title: "Nexus Feed",
    description: "Your AI-powered personalized daily digest",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Ambient 3D orb lighting */}
        <div className="orb-bg" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
