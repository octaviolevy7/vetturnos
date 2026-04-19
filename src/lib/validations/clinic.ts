import { z } from "zod";

export const clinicSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(4),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  specialtyIds: z.array(z.string()),
});

export const scheduleSchema = z.object({
  schedules: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      slotMinutes: z.number().min(15).max(120),
      isActive: z.boolean(),
    })
  ),
});

export type ClinicInput = z.infer<typeof clinicSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
