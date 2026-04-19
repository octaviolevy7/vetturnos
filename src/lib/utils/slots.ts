import { prisma } from "@/lib/prisma";

function parseTime(time: string, baseDate: Date): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export async function generateSlots(clinicId: string, daysAhead = 28) {
  const schedules = await prisma.availabilitySchedule.findMany({
    where: { clinicId, isActive: true },
  });

  if (schedules.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotsToCreate: Array<{
    clinicId: string;
    startsAt: Date;
    endsAt: Date;
  }> = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();

    const schedule = schedules.find((s: { dayOfWeek: number }) => s.dayOfWeek === dayOfWeek);
    if (!schedule) continue;

    const start = parseTime(schedule.startTime, date);
    const end = parseTime(schedule.endTime, date);
    const slotMs = schedule.slotMinutes * 60 * 1000;

    let current = start.getTime();
    while (current + slotMs <= end.getTime()) {
      slotsToCreate.push({
        clinicId,
        startsAt: new Date(current),
        endsAt: new Date(current + slotMs),
      });
      current += slotMs;
    }
  }

  const result = await prisma.availabilitySlot.createMany({
    data: slotsToCreate,
    skipDuplicates: true,
  });

  return result.count;
}
