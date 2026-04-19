export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAppointmentSchema } from "@/lib/validations/appointment";
import type { PrismaClient } from "@/generated/prisma/client";
type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let appointments;
  if (session.user.role === "PET_OWNER") {
    appointments = await prisma.appointment.findMany({
      where: { ownerId: session.user.id },
      include: {
        clinic: { select: { name: true, address: true, city: true } },
        pet: { select: { name: true, species: true } },
        slot: { select: { startsAt: true, endsAt: true } },
      },
      orderBy: { slot: { startsAt: "asc" } },
    });
  } else {
    const clinic = await prisma.clinic.findUnique({ where: { vetId: session.user.id } });
    if (!clinic) return NextResponse.json([]);
    appointments = await prisma.appointment.findMany({
      where: { clinicId: clinic.id },
      include: {
        owner: { select: { name: true, email: true, phone: true } },
        pet: { select: { name: true, species: true, breed: true } },
        slot: { select: { startsAt: true, endsAt: true } },
      },
      orderBy: { slot: { startsAt: "asc" } },
    });
  }

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "PET_OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = createAppointmentSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  const { clinicId, slotId, petId, reason } = body.data;

  try {
    const appointment = await prisma.$transaction(async (tx: TransactionClient) => {
      const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } });

      if (!slot || slot.isBooked || slot.isBlocked || slot.clinicId !== clinicId) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      return tx.appointment.create({
        data: { clinicId, ownerId: session.user.id, petId, slotId, reason },
        include: {
          clinic: { select: { name: true } },
          slot: { select: { startsAt: true, endsAt: true } },
        },
      });
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json({ error: "El turno ya no está disponible" }, { status: 409 });
    }
    throw err;
  }
}
