import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/auth/Navbar";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function OwnerDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "VETERINARIAN") redirect("/vet/dashboard");

  const upcoming = await prisma.appointment.findMany({
    where: {
      ownerId: session.user.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      slot: { startsAt: { gte: new Date() } },
    },
    include: {
      clinic: { select: { name: true, city: true } },
      slot: { select: { startsAt: true } },
    },
    orderBy: { slot: { startsAt: "asc" } },
    take: 3,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">¡Hola, {session.user.name}!</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/search" className="block rounded-xl bg-teal-600 p-6 text-white shadow-sm hover:bg-teal-700 transition-colors">
            <p className="text-lg font-semibold">Buscar veterinarias</p>
            <p className="mt-1 text-sm text-teal-100">Encontrá disponibilidad y sacá un turno</p>
          </Link>
          <Link href="/appointments" className="block rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:border-teal-300 transition-colors">
            <p className="text-lg font-semibold text-gray-900">Mis turnos</p>
            <p className="mt-1 text-sm text-gray-600">Revisá y gestioná tus turnos reservados</p>
          </Link>
        </div>

        {upcoming.length > 0 && (
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-900">Próximos turnos</h2>
            {(upcoming as Array<{ id: string; status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"; clinic: { name: string; city: string }; slot: { startsAt: Date } }>).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.clinic.name} — {a.clinic.city}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(a.slot.startsAt).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                    {" "}
                    {new Date(a.slot.startsAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
            <Link href="/appointments" className="block text-sm text-teal-600 hover:underline pt-1">Ver todos →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
