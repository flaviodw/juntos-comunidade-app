import type {Metadata} from 'next';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Juntos pela Comunidade',
  description: 'Plataforma de engajamento social e gestão de serviços urbanos.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  themeColor: '#5565F0',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body suppressHydrationWarning className="bg-white text-[#1F2937] antialiased">
        {children}
      </body>
    </html>
  );
}
