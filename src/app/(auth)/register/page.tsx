"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerSchema, type RegisterInput } from "@/lib/validations/user";
import { track } from "@/lib/amplitude";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "PET_OWNER" },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Error al registrarse");
      return;
    }

    track("user_registered", { role: data.role, method: "email" });
    router.push("/login?registered=1");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-teal-600">VetTurnos</Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Creá tu cuenta</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <Input
            label="Nombre completo"
            placeholder="Juan García"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Soy...</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 p-3 hover:bg-gray-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
                <input type="radio" value="PET_OWNER" {...register("role")} className="accent-teal-600" />
                <span className="text-sm">Dueño de mascota</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 p-3 hover:bg-gray-50 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
                <input type="radio" value="VETERINARIAN" {...register("role")} className="accent-teal-600" />
                <span className="text-sm">Veterinario</span>
              </label>
            </div>
            {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-teal-600 hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
