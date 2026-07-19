import "./globals.css";
import { Sora, Inter } from "next/font/google";
import Header from "./Header";

const display = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Meridian — Capital, by merit",
  description:
    "The founder score that follows you. Get funded for what you build, not who you know.",
};

export const viewport = {
  themeColor: "#060913",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={{ fontFamily: "var(--font-body)" }}>
        <div className="aurora" />
        <Header />
        {children}
      </body>
    </html>
  );
}
