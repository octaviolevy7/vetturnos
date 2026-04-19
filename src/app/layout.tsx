import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { AmplitudeProvider } from "@/components/AmplitudeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VetTurnos — Turnos veterinarios online",
  description: "Encontrá veterinarias disponibles y sacá turno en minutos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <SessionProvider>
          <AmplitudeProvider>{children}</AmplitudeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
