import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicSchema } from "@/lib/validations/clinic";

export async function GET(_: Request, { params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      specialties: { include: { specialty: true } },
      vet: { select: { name: true, email: true } },
    },
  });
  if (!clinic) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(clinic);
}

export async function PUT(req: Request, { params }: { params: Promise<{ clinicId: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "VETERINARIAN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { clinicId } = await params;
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic || clinic.vetId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = clinicSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  const { specialtyIds, ...data } = body.data;
  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      ...data,
      specialties: {
        deleteMany: {},
        create: specialtyIds.map((id) => ({ specialtyId: id })),
      },
    },
    include: { specialties: { include: { specialty: true } } },
  });

  return NextResponse.json(updated);
}
