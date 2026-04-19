"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/auth/Navbar";
import Link from "next/link";
import { track } from "@/lib/amplitude";

type Appointment = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  reason?: string;
  clinic: { name: string; address: string; city: string };
  pet?: { name: string; species: string };
  slot: { startsAt: string; endsAt: string };
};

export default function OwnerAppointmentsPage() {
  return <Suspense fallback={<div className="py-12 text-center text-gray-500">Cargando...</div>}><AppointmentsContent /></Suspense>;
}

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const justBooked = searchParams.get("booked") === "1";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      });
  }, []);

  const cancel = async (id: string) => {
    const appt = appointments.find((a) => a.id === id);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      if (appt) {
        const daysUntil = Math.round((new Date(appt.slot.startsAt).getTime() - Date.now()) / 86400000);
        track("appointment_cancelled", { clinic_name: appt.clinic.name, original_status: appt.status, days_until_appointment: daysUntil });
      }
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "CANCELLED" } : a));
    }
  };

  const formatSlot = (startsAt: string) => {
    const d = new Date(startsAt);
    return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " " +
      d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mis turnos</h1>
          <Link href="/search"><Button variant="secondary" size="sm">+ Nuevo turno</Button></Link>
        </div>

        {justBooked && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ¡Turno reservado con éxito! Recibirás confirmación del veterinario.
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 py-12 text-center">Cargando...</p>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-gray-500">Todavía no tenés turnos reservados.</p>
            <Link href="/search"><Button>Buscar veterinarias</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <span className="text-sm font-semibold text-gray-900">{a.clinic.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{formatSlot(a.slot.startsAt)}</p>
                  <p className="text-sm text-gray-500">{a.clinic.address}, {a.clinic.city}</p>
                  {a.reason && <p className="text-xs text-gray-400">Motivo: {a.reason}</p>}
                  {a.pet && <p className="text-xs text-gray-400">Mascota: {a.pet.name}</p>}
                </div>
                {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                  <Button variant="danger" size="sm" onClick={() => cancel(a.id)}>Cancelar</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
