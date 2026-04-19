"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/amplitude";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type DaySchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
};

const defaultSchedule = (): DaySchedule[] =>
  DAYS.map((_, i) => ({
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 30,
    isActive: i >= 1 && i <= 5,
  }));

export default function VetAvailabilityPage() {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<DaySchedule[]>(defaultSchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then(async (user) => {
        const res = await fetch(`/api/clinics?city=`);
        const data = await res.json();
        const clinic = data.clinics?.find((c: { vetId: string; id: string }) => c.vetId === user.id);
        if (clinic) setClinicId(clinic.id);
        setLoading(false);
      });
  }, []);

  const update = (index: number, field: keyof DaySchedule, value: string | number | boolean) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const save = async () => {
    if (!clinicId) return;
    setSaving(true);
    const res = await fetch(`/api/clinics/${clinicId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedules }),
    });
    if (res.ok) {
      const activeDays = schedules.filter((s) => s.isActive);
      const slotMinutes = activeDays[0]?.slotMinutes ?? 30;
      const slotsPerDay = activeDays.reduce((acc, s) => {
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = s.endTime.split(":").map(Number);
        return acc + Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / slotMinutes);
      }, 0);
      track("availability_saved", { active_days_count: activeDays.length, slot_minutes: slotMinutes, slots_generated: slotsPerDay * 4 });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Cargando...</div>;
  if (!clinicId) return (
    <div className="py-12 text-center text-gray-500">
      Primero creá tu clínica en <a href="/vet/profile" className="text-teal-600 underline">Mi clínica</a>.
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
      <p className="text-sm text-gray-600">Configurá los horarios de atención. Los turnos se generarán automáticamente para los próximos 28 días.</p>

      {saved && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">¡Horarios guardados! Slots generados correctamente.</div>}

      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Día</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Activo</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Desde</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Hasta</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Duración (min)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedules.map((s, i) => (
              <tr key={i} className={!s.isActive ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium text-gray-800">{DAYS[s.dayOfWeek]}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={s.isActive}
                    onChange={(e) => update(i, "isActive", e.target.checked)}
                    className="accent-teal-600 h-4 w-4"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={s.startTime}
                    disabled={!s.isActive}
                    onChange={(e) => update(i, "startTime", e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none disabled:bg-gray-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={s.endTime}
                    disabled={!s.isActive}
                    onChange={(e) => update(i, "endTime", e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none disabled:bg-gray-100"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={s.slotMinutes}
                    disabled={!s.isActive}
                    onChange={(e) => update(i, "slotMinutes", Number(e.target.value))}
                    className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-teal-500 focus:outline-none disabled:bg-gray-100"
                  >
                    {[15, 20, 30, 45, 60].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={save} loading={saving}>Guardar y generar turnos</Button>
    </div>
  );
}
