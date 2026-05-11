import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timber | Real-Time Social Platform",
  description: "A premium real-time collaboration and messaging experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const saved = localStorage.getItem("timber-theme");
                const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                document.documentElement.setAttribute("data-theme", saved || preferred);
              })()
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
