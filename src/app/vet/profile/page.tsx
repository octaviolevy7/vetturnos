"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clinicSchema, type ClinicInput } from "@/lib/validations/clinic";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/amplitude";

type Specialty = { id: string; name: string };
type Clinic = ClinicInput & { id: string; specialties: { specialty: Specialty }[] };

export default function VetProfilePage() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ClinicInput>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { specialtyIds: [] },
  });

  const selectedSpecialties = watch("specialtyIds") ?? [];

  useEffect(() => {
    Promise.all([
      fetch("/api/specialties").then((r) => r.json()),
      fetch("/api/clinics").then((r) => r.json()),
    ]).then(([specs, clinicData]) => {
      setSpecialties(specs);
      // Find user's clinic from the list — or fetch /api/users/me/clinic
      // For now we'll try to find via /api/users/me
      fetch("/api/users/me").then((r) => r.json()).then((user) => {
        if (clinicData.clinics) {
          const found = clinicData.clinics.find((c: Clinic & { vetId: string }) => c.vetId === user.id);
          if (found) {
            setClinic(found);
            reset({
              ...found,
              specialtyIds: found.specialties.map((s: { specialty: Specialty }) => s.specialty.id),
              website: found.website ?? "",
            });
          }
        }
        setLoading(false);
      });
    });
  }, [reset]);

  const toggleSpecialty = (id: string) => {
    const current = selectedSpecialties;
    setValue(
      "specialtyIds",
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );
  };

  const onSubmit = async (data: ClinicInput) => {
    const method = clinic ? "PUT" : "POST";
    const url = clinic ? `/api/clinics/${clinic.id}` : "/api/clinics";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      track(clinic ? "clinic_updated" : "clinic_created", { city: data.city, specialties_count: data.specialtyIds?.length ?? 0 });
      setClinic(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{clinic ? "Mi clínica" : "Crear clínica"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        {saved && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">¡Guardado correctamente!</div>}

        <Input label="Nombre de la clínica" error={errors.name?.message} {...register("name")} />
        <Input label="Dirección" error={errors.address?.message} {...register("address")} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Ciudad" error={errors.city?.message} {...register("city")} />
          <Input label="Provincia" error={errors.state?.message} {...register("state")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Código postal" error={errors.zipCode?.message} {...register("zipCode")} />
          <Input label="Teléfono" type="tel" error={errors.phone?.message} {...register("phone")} />
        </div>

        <Input label="Sitio web (opcional)" type="url" placeholder="https://..." error={errors.website?.message} {...register("website")} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Especialidades</label>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSpecialty(s.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selectedSpecialties.includes(s.id)
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-gray-300 text-gray-600 hover:border-teal-300"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={isSubmitting}>
          {clinic ? "Guardar cambios" : "Crear clínica"}
        </Button>
      </form>
    </div>
  );
}
