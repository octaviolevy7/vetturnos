"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/amplitude";

type Appointment = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  reason?: string;
  owner: { name: string; email: string; phone?: string };
  pet?: { name: string; species: string; breed?: string };
  slot: { startsAt: string; endsAt: string };
};

export default function VetAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const appt = appointments.find((a) => a.id === id);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      if (appt) {
        const daysUntil = Math.round((new Date(appt.slot.startsAt).getTime() - Date.now()) / 86400000);
        if (status === "CONFIRMED") track("appointment_confirmed", { days_until_appointment: daysUntil });
        if (status === "CANCELLED") track("appointment_rejected", { days_until_appointment: daysUntil });
        if (status === "COMPLETED") track("appointment_completed");
      }
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a)));
    }
  };

  const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

  const formatSlot = (startsAt: string, endsAt: string) => {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    return `${start.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })} ${start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
  const FILTER_LABELS: Record<string, string> = { ALL: "Todos", PENDING: "Pendientes", CONFIRMED: "Confirmados", COMPLETED: "Completados", CANCELLED: "Cancelados" };

  if (loading) return <div className="py-12 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === f ? "bg-teal-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:border-teal-400"}`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 py-8">No hay turnos con ese filtro.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  <span className="text-sm font-medium text-gray-900">{formatSlot(a.slot.startsAt, a.slot.endsAt)}</span>
                </div>
                <p className="text-sm text-gray-700">
                  <strong>{a.owner.name}</strong>
                  {a.pet && <span className="text-gray-500"> — {a.pet.name} ({a.pet.species})</span>}
                </p>
                {a.reason && <p className="text-xs text-gray-500">Motivo: {a.reason}</p>}
                <p className="text-xs text-gray-400">{a.owner.email}{a.owner.phone && ` · ${a.owner.phone}`}</p>
              </div>

              {a.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateStatus(a.id, "CONFIRMED")}>Confirmar</Button>
                  <Button size="sm" variant="danger" onClick={() => updateStatus(a.id, "CANCELLED")}>Rechazar</Button>
                </div>
              )}
              {a.status === "CONFIRMED" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(a.id, "COMPLETED")}>Completado</Button>
                  <Button size="sm" variant="danger" onClick={() => updateStatus(a.id, "CANCELLED")}>Cancelar</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
