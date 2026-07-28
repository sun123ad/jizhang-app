import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthProvider";
import { NavBar } from "@/app/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "我们的账本",
  description: "两人共用的记账工具",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

// Every page is behind login and reads per-user data client-side, so there's
// nothing to statically prerender. Forcing dynamic rendering site-wide also
// sidesteps Next 16's build-time static-generation edge cases (e.g. the
// /_not-found prerender crash caused by client navigation hooks in the layout).
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <AuthProvider>
          <main className="mx-auto w-full max-w-md flex-1 px-4 pb-4 pt-4">
            {children}
          </main>
          <div className="mx-auto w-full max-w-md">
            <NavBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
