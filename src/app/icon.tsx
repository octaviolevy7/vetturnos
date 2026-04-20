import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#0d9488",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
          <ellipse cx="20" cy="26.5" rx="7" ry="5.5" fill="white" />
          <ellipse cx="11.5" cy="20" rx="3" ry="3.8" fill="white" transform="rotate(-22 11.5 20)" />
          <ellipse cx="17" cy="15.5" rx="3" ry="3.8" fill="white" transform="rotate(-8 17 15.5)" />
          <ellipse cx="23" cy="15.5" rx="3" ry="3.8" fill="white" transform="rotate(8 23 15.5)" />
          <ellipse cx="28.5" cy="20" rx="3" ry="3.8" fill="white" transform="rotate(22 28.5 20)" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
