import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleSchema } from "@/lib/validations/clinic";
import { generateSlots } from "@/lib/utils/slots";
import type { Prisma } from "@/generated/prisma/internal/prismaNamespace";

export async function GET(req: Request, { params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Parámetro date requerido" }, { status: 400 });
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const slots = await prisma.availabilitySlot.findMany({
    where: {
      clinicId,
      startsAt: { gte: dayStart, lte: dayEnd },
      isBlocked: false,
    },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json(slots);
}

export async function POST(req: Request, { params }: { params: Promise<{ clinicId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "VETERINARIAN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { clinicId } = await params;
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic || clinic.vetId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = scheduleSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const s of body.data.schedules) {
      await tx.availabilitySchedule.upsert({
        where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: s.dayOfWeek } },
        update: s,
        create: { clinicId, ...s },
      });
    }
    await tx.availabilitySlot.deleteMany({
      where: { clinicId, isBooked: false, startsAt: { gte: new Date() } },
    });
  });

  const count = await generateSlots(clinicId);
  return NextResponse.json({ message: "Horarios guardados", slotsGenerated: count });
}
