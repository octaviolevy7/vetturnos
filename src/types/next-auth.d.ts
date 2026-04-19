import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PET_OWNER" | "VETERINARIAN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PET_OWNER" | "VETERINARIAN";
  }
}
