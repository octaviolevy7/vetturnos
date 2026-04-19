import Link from "next/link";
import { Navbar } from "@/components/auth/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-24 text-white sm:px-6">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Turnos veterinarios<br />en minutos
          </h1>
          <p className="text-lg text-teal-100">
            Encontrá veterinarias disponibles cerca tuyo, elegí el horario que mejor te quede y confirmá tu turno al instante.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/search"
              className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Buscar veterinarias
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">¿Cómo funciona?</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              step="1"
              title="Buscá"
              description="Filtrá por ciudad, especialidad y fecha para encontrar la clínica ideal para tu mascota."
            />
            <FeatureCard
              step="2"
              title="Elegí el horario"
              description="Mirá los turnos disponibles en tiempo real y seleccioná el que más te convenga."
            />
            <FeatureCard
              step="3"
              title="¡Listo!"
              description="El veterinario confirma tu turno y recibís un recordatorio. Sin llamadas, sin esperas."
            />
          </div>
        </div>
      </section>

      {/* Vet CTA */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">¿Sos veterinario?</h2>
          <p className="text-gray-600">Gestioná tu agenda online, confirmá turnos y reducí los no-shows.</p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 transition-colors"
          >
            Registrar mi clínica
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xl font-bold">
        {step}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
