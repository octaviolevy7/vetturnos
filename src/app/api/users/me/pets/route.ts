export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const petSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  size: z.string().optional(),
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  weightKg: z.number().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "PET_OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pets = await prisma.pet.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(pets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "PET_OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = petSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  const pet = await prisma.pet.create({
    data: {
      ...body.data,
      dateOfBirth: body.data.dateOfBirth ? new Date(body.data.dateOfBirth) : undefined,
      ownerId: session.user.id,
    },
  });
  return NextResponse.json(pet, { status: 201 });
}
