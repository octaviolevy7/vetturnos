import { z } from "zod";

export const createAppointmentSchema = z.object({
  clinicId: z.string(),
  slotId: z.string(),
  petId: z.string().optional(),
  reason: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
