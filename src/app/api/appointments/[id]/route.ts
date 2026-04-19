import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAppointmentSchema } from "@/lib/validations/appointment";
import type { PrismaClient } from "@/generated/prisma/client";
type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { clinic: true },
  });
  if (!appointment) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isOwner = session.user.role === "PET_OWNER" && appointment.ownerId === session.user.id;
  const isVet = session.user.role === "VETERINARIAN" && appointment.clinic.vetId === session.user.id;
  if (!isOwner && !isVet) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = updateAppointmentSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  const { status, notes } = body.data;

  // Owners can only cancel, vets can confirm/complete/no-show/cancel
  if (session.user.role === "PET_OWNER" && status !== "CANCELLED") {
    return NextResponse.json({ error: "Los dueños solo pueden cancelar" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx: TransactionClient) => {
    if (status === "CANCELLED") {
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }
    return tx.appointment.update({
      where: { id },
      data: { status, notes },
      include: { slot: { select: { startsAt: true, endsAt: true } } },
    });
  });

  return NextResponse.json(updated);
}
