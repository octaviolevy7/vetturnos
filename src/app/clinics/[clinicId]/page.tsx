"use server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/auth/Navbar";
import { TrackEvent } from "@/components/TrackEvent";

export default async function ClinicDetailPage({ params, searchParams }: {
  params: Promise<{ clinicId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { clinicId } = await params;
  const { date } = await searchParams;

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      specialties: { include: { specialty: true } },
      vet: { select: { name: true } },
    },
  });

  if (!clinic) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TrackEvent event="clinic_viewed" props={{ clinic_id: clinic.id, clinic_name: clinic.name, city: clinic.city, specialties_count: clinic.specialties.length }} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <Link href="/search" className="text-sm text-teal-600 hover:underline">← Volver a la búsqueda</Link>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>

          <div className="space-y-1 text-sm text-gray-600">
            <p>📍 {clinic.address}, {clinic.city}, {clinic.state} {clinic.zipCode}</p>
            {clinic.phone && <p>📞 {clinic.phone}</p>}
            {clinic.website && <p>🌐 <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">{clinic.website}</a></p>}
            <p>👨‍⚕️ Veterinario: {clinic.vet.name}</p>
          </div>

          {clinic.description && <p className="text-gray-700">{clinic.description}</p>}

          {clinic.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {clinic.specialties.map(({ specialty }: { specialty: { id: string; name: string } }) => (
                <span key={specialty.id} className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-sm text-teal-700">{specialty.name}</span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-teal-600 p-6 text-center shadow-sm">
          <p className="text-white font-medium mb-3">¿Listo para sacar tu turno?</p>
          <Link
            href={`/book/${clinicId}${date ? `?date=${date}` : ""}`}
            className="inline-block rounded-lg bg-white px-6 py-2.5 font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
          >
            Sacar turno
          </Link>
        </div>
      </main>
    </div>
  );
}
