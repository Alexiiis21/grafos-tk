import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Automatas",
  description: "Visualizador de autómatas y operaciones",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
        <body className="relative h-full font-sans antialiased">
          <main className="bg-white relative flex flex-col min-h-screen">
          <Navbar />
        {children}
          </main>
        </body>
    </html>
  );
}
