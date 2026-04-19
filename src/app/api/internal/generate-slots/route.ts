export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/utils/slots";

// Called by cron or manually to generate availability slots for all active clinics
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let total = 0;
  for (const clinic of clinics) {
    total += await generateSlots(clinic.id);
  }

  return NextResponse.json({ message: "Slots generados", total });
}
