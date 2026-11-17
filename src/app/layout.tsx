import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Smart Chili Warehouse", description:"Smart Chili Warehouse IoT and AI dashboard" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="id"><body>{children}</body></html>;
}
