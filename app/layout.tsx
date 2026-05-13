import type { Metadata } from "next";
import {
  Montserrat,
  Playfair_Display,
  Inter,
  Bebas_Neue,
  Roboto,
  Open_Sans,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/reforma/site-header";
import { ThemeStyles } from "@/components/theme/theme-styles";
import { getBrand } from "@/lib/site-config";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-montserrat",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
});
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open_sans",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source_sans",
});

const fontVars = [
  montserrat.variable,
  playfair.variable,
  inter.variable,
  bebas.variable,
  roboto.variable,
  openSans.variable,
  sourceSans.variable,
].join(" ");

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    title: brand.name,
    description: brand.tagline,
    openGraph: {
      title: brand.name,
      description: brand.tagline,
      images: brand.og_image_url ? [brand.og_image_url] : undefined,
    },
    icons: {
      icon: brand.favicon_url ?? "/icon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fontVars}>
      <body className="min-h-screen">
        <ThemeStyles />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
