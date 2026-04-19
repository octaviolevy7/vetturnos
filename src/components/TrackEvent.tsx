"use client";

import { useEffect } from "react";
import { track } from "@/lib/amplitude";

export function TrackEvent({ event, props }: { event: string; props?: Record<string, unknown> }) {
  useEffect(() => {
    track(event, props);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
