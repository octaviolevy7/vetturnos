export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicSchema } from "@/lib/validations/clinic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const specialtyId = searchParams.get("specialtyId");
  const date = searchParams.get("date");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 12;

  const where: Record<string, unknown> = { isActive: true };

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (specialtyId) {
    where.specialties = { some: { specialtyId } };
  }

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    where.slots = {
      some: { startsAt: { gte: dayStart, lte: dayEnd }, isBooked: false, isBlocked: false },
    };
  }

  if (lat && lng) {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    const delta = 0.5;
    where.lat = { gte: latN - delta, lte: latN + delta };
    where.lng = { gte: lngN - delta, lte: lngN + delta };
  }

  const [clinics, total] = await Promise.all([
    prisma.clinic.findMany({
      where,
      include: { specialties: { include: { specialty: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.clinic.count({ where }),
  ]);

  return NextResponse.json({ clinics, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "VETERINARIAN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const existing = await prisma.clinic.findUnique({ where: { vetId: session.user.id } });
  if (existing) {
    return NextResponse.json({ error: "Ya tenés una clínica registrada" }, { status: 409 });
  }

  const body = clinicSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  const { specialtyIds, ...data } = body.data;
  const clinic = await prisma.clinic.create({
    data: {
      ...data,
      vetId: session.user.id,
      specialties: {
        create: specialtyIds.map((id) => ({ specialtyId: id })),
      },
    },
    include: { specialties: { include: { specialty: true } } },
  });

  return NextResponse.json(clinic, { status: 201 });
}
