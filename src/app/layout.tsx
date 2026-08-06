import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import LoginBonusChecker from './components/LoginBonusChecker'; 
// ✅ IMPORT THE NEW CLIENT COMPONENTS
import OfflineSyncTrigger from '../components/OfflineSyncTrigger';
import OfflineBanner from './components/OfflineBanner'; // ✅ ADDED THIS

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LicTech - BLEPP Reviewer",
  description: "Free Psychometrician Board Exam Reviewer with Coin System",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white" suppressHydrationWarning>
        {/* ✅ RENDER OFFLINE BANNER FIRST (Highest Z-Index) */}
        <OfflineBanner />
        
        {/* ✅ RENDER OTHER CLIENT COMPONENTS */}
        <OfflineSyncTrigger />
        <LoginBonusChecker /> 
        
        {children}

        <Toaster 
          position="top-center" 
          theme="dark" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: '#111827',
              border: '1px solid #374151',
              color: '#f3f4f6',
            },
          }}
        />
      </body>
    </html>
  );
}