import type { Metadata } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource-variable/jetbrains-mono";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "T-CAD — Temporal Collaborative Anomaly Detection | CS 528",
  description:
    "Interactive research presentation: data fabrication in collaborative vehicular perception, the CAD defense (Zhang et al., USENIX Security 2024), and the proposed T-CAD temporal/probabilistic extension.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
