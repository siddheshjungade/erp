import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Solar ERP - Vertical SaaS MVP",
  description: "Next-generation solar operational ERP built on a secure Google Sheets database architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fbfdfb] text-[#1c2b21]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
