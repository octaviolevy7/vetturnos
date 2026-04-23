"use client";

import { useState } from "react";
import { track } from "@/lib/amplitude";

const LABELS: Record<number, string> = {
  1: "Muy mala",
  2: "Mala",
  3: "Regular",
  4: "Buena",
  5: "Excelente",
};

export function CSATModal({ onClose, eventName = "booking_csat_submitted" }: { onClose: () => void; eventName?: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    track(eventName, { rating: selected });
    setSubmitted(true);
    setTimeout(onClose, 1500);
  };

  const handleDismiss = () => {
    track("booking_csat_dismissed");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-5">
        {submitted ? (
          <div className="text-center space-y-2 py-4">
            <p className="text-2xl">🎉</p>
            <p className="font-semibold text-gray-900">¡Gracias por tu respuesta!</p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <p className="font-semibold text-gray-900">¿Cómo fue tu experiencia reservando el turno?</p>
              <p className="text-sm text-gray-500">Tu opinión nos ayuda a mejorar</p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelected(n)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${
                    selected === n
                      ? "border-teal-500 bg-teal-50 text-teal-700 scale-110"
                      : "border-gray-200 text-gray-500 hover:border-teal-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {selected && (
              <p className="text-center text-sm text-teal-600 font-medium">{LABELS[selected]}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={!selected}
                className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
              >
                Enviar
              </button>
              <button
                onClick={handleDismiss}
                className="w-full text-sm text-gray-400 hover:text-gray-600"
              >
                Omitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
