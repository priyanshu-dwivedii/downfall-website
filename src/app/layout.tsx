import type { Metadata } from "next";
import { Inter, Oswald, Playfair_Display } from "next/font/google";
import "./globals.css";
import Footer from "./Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "DOWNFALL - Every Version of You",
  description: "One wardrobe. Every moment.",
};

import ScrollBehavior from "./ScrollBehavior";

import { CartProvider } from "./context/CartContext";
import { MenuProvider } from "./context/MenuContext";
import CartDrawer from "./cart/CartDrawer";
import MenuDrawer from "./MenuDrawer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>
          <MenuProvider>
            <ScrollBehavior />
            {children}
            <Footer />
            <CartDrawer />
            <MenuDrawer />
          </MenuProvider>
        </CartProvider>
      </body>
    </html>
  );
}
