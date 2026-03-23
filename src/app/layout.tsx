import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FlowCraft AI - Visual Workflow Builder",
  description:
    "Build powerful AI workflows with a visual node-based editor. Connect LLMs, image processing, and video analysis nodes.",
  keywords: "AI workflow, visual programming, node editor, LLM, image processing",
  openGraph: {
    title: "FlowCraft AI - Visual Workflow Builder",
    description: "Build powerful AI workflows visually",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0a0a0f] text-white antialiased">
        <ClerkProvider>

          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1a2e",
                color: "#fff",
                border: "1px solid #2d2d44",
              },
            }}
          />
        </ClerkProvider>
      </body>
    </html>
  );
}
