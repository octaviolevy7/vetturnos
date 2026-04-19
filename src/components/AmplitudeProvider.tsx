"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initAmplitude, identify } from "@/lib/amplitude";

export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    initAmplitude();
  }, []);

  useEffect(() => {
    if (session?.user) {
      identify(session.user.id, { role: session.user.role });
    }
  }, [session]);

  return <>{children}</>;
}
