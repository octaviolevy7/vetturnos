"use client";

import * as amplitude from "@amplitude/analytics-browser";

export function initAmplitude() {
  const key = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!key) return;
  amplitude.init(key, { defaultTracking: false });
}

export function identify(userId: string, props?: Record<string, unknown>) {
  amplitude.setUserId(userId);
  if (props) {
    const obj = new amplitude.Identify();
    Object.entries(props).forEach(([k, v]) =>
      obj.set(k, v as amplitude.Types.ValidPropertyType)
    );
    amplitude.identify(obj);
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return;
  amplitude.track(event, props);
}
