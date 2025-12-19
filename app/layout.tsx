import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bausing",
  description: "Bausing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={`${dmSans.className} bg-white`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <WhatsAppButton />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
