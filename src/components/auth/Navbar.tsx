"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LogoFull } from "@/components/ui/Logo";

export function Navbar() {
  const { data: session } = useSession();
  const isVet = session?.user.role === "VETERINARIAN";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/">
          <LogoFull size={30} />
        </Link>

        <div className="flex items-center gap-3">
          {!session ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Ingresar</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          ) : isVet ? (
            <>
              <Link href="/vet/dashboard" className="text-sm text-gray-600 hover:text-teal-600">Dashboard</Link>
              <Link href="/vet/appointments" className="text-sm text-gray-600 hover:text-teal-600">Turnos</Link>
              <Link href="/vet/profile" className="text-sm text-gray-600 hover:text-teal-600">Mi clínica</Link>
              <Button variant="secondary" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>Salir</Button>
            </>
          ) : (
            <>
              <Link href="/search" className="text-sm text-gray-600 hover:text-teal-600">Buscar</Link>
              <Link href="/appointments" className="text-sm text-gray-600 hover:text-teal-600">Mis turnos</Link>
              <Button variant="secondary" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>Salir</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
