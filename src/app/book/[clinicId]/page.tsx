"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/auth/Navbar";
import { track } from "@/lib/amplitude";
import { CSATModal } from "@/components/ui/CSATModal";

type Slot = { id: string; startsAt: string; endsAt: string; isBooked: boolean; isBlocked: boolean };
type Pet = { id: string; name: string; species: string };

const SPECIES = ["Perro", "Gato", "Ave", "Conejo", "Otro"];
const SIZES = ["Pequeño", "Mediano", "Grande"];

type Step = "date" | "slot" | "confirm";

export default function BookingPage({ params }: { params: { clinicId: string } }) {
  return <Suspense fallback={<div className="py-12 text-center text-gray-500">Cargando...</div>}><BookingContent clinicId={params.clinicId} /></Suspense>;
}

function BookingContent({ clinicId: initialClinicId }: { clinicId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clinicId] = useState(initialClinicId);
  const [clinicName, setClinicName] = useState("");
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [showCSAT, setShowCSAT] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [newPetName, setNewPetName] = useState("");
  const [newPetSpecies, setNewPetSpecies] = useState("");
  const [newPetSize, setNewPetSize] = useState("");

  useEffect(() => {
    fetch(`/api/clinics/${initialClinicId}`)
      .then((r) => r.json())
      .then((c) => {
        setClinicName(c.name ?? "");
        track("booking_started", { clinic_id: initialClinicId, clinic_name: c.name });
      });
  }, [initialClinicId]);

  useEffect(() => {
    if (step === "confirm") {
      fetch("/api/users/me/pets").then((r) => r.json()).then((data) => {
        if (Array.isArray(data)) setPets(data);
      });
    }
  }, [step]);

  useEffect(() => {
    if (selectedDate && clinicId) {
      setLoadingSlots(true);
      fetch(`/api/clinics/${clinicId}/availability?date=${selectedDate}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(Array.isArray(data) ? data : []);
          setLoadingSlots(false);
        });
    }
  }, [selectedDate, clinicId]);

  const availableSlots = slots.filter((s) => !s.isBooked && !s.isBlocked);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError("");
    let petId: string | undefined = selectedPetId || undefined;
    if (!petId && newPetName && newPetSpecies) {
      const petRes = await fetch("/api/users/me/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPetName, species: newPetSpecies, size: newPetSize || undefined }),
      });
      if (petRes.ok) petId = (await petRes.json()).id;
    }


    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId, slotId: selectedSlot.id, reason, petId }),
    });

    if (res.status === 409) {
      track("booking_conflict", { clinic_id: clinicId, date: selectedDate, time: formatTime(selectedSlot.startsAt) });
      setError("Este turno ya fue tomado. Por favor elegí otro.");
      setStep("slot");
      setSelectedSlot(null);
      setBooking(false);
      return;
    }

    if (!res.ok) {
      setError("Error al reservar el turno. Intentá de nuevo.");
      setBooking(false);
      return;
    }

    track("booking_completed", { clinic_id: clinicId, clinic_name: clinicName, date: selectedDate, time: formatTime(selectedSlot.startsAt), has_reason: reason.trim().length > 0 });
    setShowCSAT(true);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {showCSAT && <CSATModal onClose={() => router.push("/appointments?booked=1")} />}
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sacar turno</h1>
          {clinicName && <p className="text-gray-600">{clinicName}</p>}
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 text-sm">
          {(["date", "slot", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === s ? "bg-teal-600 text-white" : i < ["date", "slot", "confirm"].indexOf(step) ? "bg-teal-200 text-teal-700" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
              <span className={step === s ? "font-medium text-gray-900" : "text-gray-400"}>
                {s === "date" ? "Fecha" : s === "slot" ? "Horario" : "Confirmar"}
              </span>
              {i < 2 && <span className="text-gray-300">›</span>}
            </div>
          ))}
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* Step 1: Date */}
        {step === "date" && (
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">1. Elegí la fecha</h2>
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <Button disabled={!selectedDate} onClick={() => {
              track("booking_date_selected", { clinic_id: clinicId, date: selectedDate, available_slots_count: availableSlots.length });
              setStep("slot");
            }}>Ver horarios disponibles</Button>
          </div>
        )}

        {/* Step 2: Slot */}
        {step === "slot" && (
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">2. Elegí el horario</h2>
              <button onClick={() => setStep("date")} className="text-sm text-teal-600 hover:underline">{formatDate(selectedDate)}</button>
            </div>

            {loadingSlots ? (
              <p className="text-gray-500 text-sm">Cargando horarios...</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay turnos disponibles para esa fecha. Elegí otra fecha.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      track("booking_slot_selected", { clinic_id: clinicId, date: selectedDate, time: formatTime(slot.startsAt) });
                      setSelectedSlot(slot);
                    }}
                    className={`rounded-lg border py-2 text-sm font-medium transition-colors ${selectedSlot?.id === slot.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-700 hover:border-teal-300"}`}
                  >
                    {formatTime(slot.startsAt)}
                  </button>
                ))}
              </div>
            )}

            <Button disabled={!selectedSlot} onClick={() => setStep("confirm")}>Continuar</Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedSlot && (
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">3. Confirmá tu turno</h2>

            <div className="rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
              <p><span className="text-gray-500">Clínica:</span> <strong>{clinicName}</strong></p>
              <p><span className="text-gray-500">Fecha:</span> <strong>{formatDate(selectedDate)}</strong></p>
              <p><span className="text-gray-500">Horario:</span> <strong>{formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)}</strong></p>
            </div>

            {/* Pet selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Mascota (opcional)</label>
              {pets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(selectedPetId === pet.id ? "" : pet.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${selectedPetId === pet.id ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:border-teal-300"}`}
                    >
                      {pet.name} <span className="text-gray-400">· {pet.species}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setSelectedPetId(""); setNewPetName(""); setNewPetSpecies(""); }}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${!selectedPetId && (newPetName || newPetSpecies) ? "border-teal-500 bg-teal-50 text-teal-700" : "border-dashed border-gray-300 text-gray-400 hover:border-teal-300"}`}
                  >
                    + Otra mascota
                  </button>
                </div>
              )}
              {(!selectedPetId) && (
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 min-w-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <select
                    value={newPetSpecies}
                    onChange={(e) => setNewPetSpecies(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Tipo</option>
                    {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={newPetSize}
                    onChange={(e) => setNewPetSize(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Tamaño</option>
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Motivo de la consulta (opcional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ej: chequeo anual, vacunas, malestar general..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("slot")}>Cambiar horario</Button>
              <Button loading={booking} onClick={handleBook}>Confirmar turno</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
