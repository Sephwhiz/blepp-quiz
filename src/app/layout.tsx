import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner"; // ✅ Import Toaster
import "./globals.css";
// ✅ Import the isolated Client Component
import LoginBonusChecker from './components/LoginBonusChecker'; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BLEPP Quiz - Philippine Board Exam Prep",
  description: "Master your licensure exams with scenario-based quizzes and gamified learning.",
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
        {/* ✅ Client logic is safely isolated here */}
        <LoginBonusChecker /> 
        
        {/* Main Content */}
        {children}

        {/* ✅ Global Toast Notifications Provider */}
        <Toaster 
          position="top-center" 
          theme="dark" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: '#111827', // gray-900
              border: '1px solid #374151', // gray-700
              color: '#f3f4f6', // gray-100
            },
          }}
        />
      </body>
    </html>
  );
}