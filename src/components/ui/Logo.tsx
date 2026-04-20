export function LogoMark({ size = 32, variant = "color" }: { size?: number; variant?: "color" | "light" }) {
  const bg = variant === "light" ? "white" : "#0d9488";
  const paw = variant === "light" ? "#0d9488" : "white";

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill={bg} />
      {/* Main pad */}
      <ellipse cx="20" cy="26.5" rx="7" ry="5.5" fill={paw} />
      {/* Toe pads */}
      <ellipse cx="11.5" cy="20" rx="3" ry="3.8" fill={paw} transform="rotate(-22 11.5 20)" />
      <ellipse cx="17" cy="15.5" rx="3" ry="3.8" fill={paw} transform="rotate(-8 17 15.5)" />
      <ellipse cx="23" cy="15.5" rx="3" ry="3.8" fill={paw} transform="rotate(8 23 15.5)" />
      <ellipse cx="28.5" cy="20" rx="3" ry="3.8" fill={paw} transform="rotate(22 28.5 20)" />
    </svg>
  );
}

export function LogoFull({ size = 32, textClass = "text-teal-600" }: { size?: number; textClass?: string }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className={`font-bold ${textClass}`} style={{ fontSize: size * 0.6 }}>VetTurnos</span>
    </span>
  );
}
