"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginInput } from "@/lib/validations/user";
import { track } from "@/lib/amplitude";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    const result = await signIn("credentials", { ...data, redirect: false });
    if (result?.error) {
      setError("Email o contraseña incorrectos");
      return;
    }
    // Redirect based on role will be handled by middleware after session refresh
    track("user_logged_in");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-teal-600">VetTurnos</Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Ingresá a tu cuenta</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

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
            placeholder="••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Ingresar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-teal-600 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
