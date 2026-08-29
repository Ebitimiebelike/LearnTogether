import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { THEME_STORAGE_KEY } from "@/hooks/useTheme";

/**
 * Nunito: rounded, friendly and highly legible, with unambiguous letterforms —
 * which matters in an app whose whole purpose is teaching those letterforms.
 * `next/font` downloads and self-hosts it at build time, so nothing is fetched
 * from a CDN at runtime and it is available offline.
 */
const appFont = Nunito({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnTogether",
  description:
    "Letters, numbers and tracing practice. Works offline, with no ads and no account.",
  applicationName: "LearnTogether",
  appleWebApp: {
    capable: true,
    title: "LearnTogether",
    statusBarStyle: "default",
  },
  // No indexing concerns for an offline learning tool, but be explicit.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2557c7",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available: it is an accessibility feature, not a bug.
  maximumScale: 5,
  viewportFit: "cover",
};

/**
 * Applied before first paint so a learner who chose dark mode never sees a
 * flash of the light theme. The stored value is only a rendering hint; the
 * setting itself lives in IndexedDB.
 */
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${appFont.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
