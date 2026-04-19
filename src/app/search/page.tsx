"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/auth/Navbar";
import { track } from "@/lib/amplitude";

type Specialty = { id: string; name: string };
type Clinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  specialties: { specialty: Specialty }[];
};

export default function SearchPage() {
  return <Suspense fallback={<div className="py-12 text-center text-gray-500">Cargando...</div>}><SearchContent /></Suspense>;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? "");
  const [specialtyId, setSpecialtyId] = useState(searchParams.get("specialtyId") ?? "");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/specialties").then((r) => r.json()).then(setSpecialties);
  }, []);

  const search = useCallback(async (params: { city: string; date: string; specialtyId: string }) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (params.city) q.set("city", params.city);
    if (params.date) q.set("date", params.date);
    if (params.specialtyId) q.set("specialtyId", params.specialtyId);

    router.replace(`/search?${q.toString()}`, { scroll: false });

    const res = await fetch(`/api/clinics?${q.toString()}`);
    const data = await res.json();
    const results = data.clinics ?? [];
    setClinics(results);
    setTotal(data.total ?? 0);
    setLoading(false);
    track("search_performed", {
      city: params.city || null,
      date: params.date || null,
      specialty_id: params.specialtyId || null,
      results_count: data.total ?? 0,
    });
  }, [router]);

  useEffect(() => {
    search({ city, date, specialtyId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: only run on mount

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search({ city, date, specialtyId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Buscar veterinarias</h1>

        <form onSubmit={handleSearch} className="mb-8 flex flex-wrap gap-3 rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
          <div className="flex-1 min-w-[180px]">
            <Input
              label="Ciudad"
              placeholder="Buenos Aires"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Especialidad</label>
              <select
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Todas</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={loading}>Buscar</Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Buscando...</div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">{total} resultado{total !== 1 ? "s" : ""}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} date={date} />
              ))}
            </div>
            {total === 0 && (
              <div className="py-16 text-center text-gray-500">
                No encontramos veterinarias con esos criterios. Probá cambiando la ciudad o la fecha.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ClinicCard({ clinic, date }: { clinic: Clinic; date: string }) {
  return (
    <div className="flex flex-col rounded-xl bg-white border border-gray-200 shadow-sm hover:border-teal-300 transition-colors overflow-hidden">
      <div className="p-4 flex-1 space-y-2">
        <h2 className="font-semibold text-gray-900">{clinic.name}</h2>
        <p className="text-sm text-gray-600">{clinic.address}, {clinic.city}</p>
        {clinic.phone && <p className="text-sm text-gray-500">{clinic.phone}</p>}
        <div className="flex flex-wrap gap-1">
          {clinic.specialties.map(({ specialty }) => (
            <span key={specialty.id} className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700">{specialty.name}</span>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 p-3">
        <Link
          href={`/clinics/${clinic.id}${date ? `?date=${date}` : ""}`}
          className="block w-full rounded-lg bg-teal-600 py-2 text-center text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          Ver turnos disponibles
        </Link>
      </div>
    </div>
  );
}
