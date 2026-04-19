import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function VetDashboardPage() {
  const session = await auth();
  const clinic = await prisma.clinic.findUnique({
    where: { vetId: session!.user.id },
    include: { _count: { select: { appointments: true } } },
  });

  if (!clinic) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido, {session?.user.name}!</h1>
        <p className="text-gray-600">Todavía no registraste tu clínica. Creá tu perfil para empezar a recibir turnos.</p>
        <Link href="/vet/profile"><Button>Crear mi clínica</Button></Link>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [todayAppointments, pending] = await Promise.all([
    prisma.appointment.count({
      where: { clinicId: clinic.id, slot: { startsAt: { gte: today, lt: tomorrow } } },
    }),
    prisma.appointment.count({ where: { clinicId: clinic.id, status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
        <p className="text-gray-600">{clinic.city}, {clinic.state}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Turnos hoy" value={todayAppointments} href="/vet/appointments" />
        <StatCard label="Pendientes de confirmación" value={pending} href="/vet/appointments?status=PENDING" />
        <StatCard label="Total turnos" value={clinic._count.appointments} href="/vet/appointments" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink href="/vet/availability" title="Gestionar disponibilidad" desc="Configurá tus horarios y bloqueá fechas" />
        <QuickLink href="/vet/profile" title="Editar perfil de clínica" desc="Actualizá datos, especialidades y logo" />
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-teal-300 transition-colors">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-teal-600">{value}</p>
    </Link>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-teal-300 transition-colors">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </Link>
  );
}
