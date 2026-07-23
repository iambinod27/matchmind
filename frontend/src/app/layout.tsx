import { Barlow_Condensed, Inter, Titillium_Web } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${inter.variable} ${titillium.variable}`}
    >
      <body
        className="bg-[#F7F5EF] text-[#14201A] font-body antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
