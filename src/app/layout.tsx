import type { Metadata } from "next";
import { Caveat, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bonbon — your LinkedIn, sweetened",
  description: "Turn life moments, projects and learnings into LinkedIn posts in your own voice, then schedule them with Buffer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
