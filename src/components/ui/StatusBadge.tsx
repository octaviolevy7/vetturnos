import { cn } from "@/lib/utils/cn";

const statusConfig = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmado", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  COMPLETED: { label: "Completado", className: "bg-blue-100 text-blue-800" },
  NO_SHOW: { label: "No se presentó", className: "bg-gray-100 text-gray-800" },
};

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
