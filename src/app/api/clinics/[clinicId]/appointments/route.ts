import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ clinicId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "VETERINARIAN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { clinicId } = await params;
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic || clinic.vetId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      ...(status ? { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW" } : {}),
    },
    include: {
      owner: { select: { name: true, email: true, phone: true } },
      pet: { select: { name: true, species: true, breed: true } },
      slot: { select: { startsAt: true, endsAt: true } },
    },
    orderBy: { slot: { startsAt: "asc" } },
  });

  return NextResponse.json(appointments);
}
