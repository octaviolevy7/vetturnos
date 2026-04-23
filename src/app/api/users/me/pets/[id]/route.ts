export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  medicalNotes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "PET_OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.format() }, { status: 400 });
  }

  const pet = await prisma.pet.update({
    where: { id: params.id, ownerId: session.user.id },
    data: body.data,
  });
  return NextResponse.json(pet);
}
