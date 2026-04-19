import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const specialties = [
    "Caninos",
    "Felinos",
    "Aves",
    "Exóticos",
    "Pequeños animales",
    "Grandes animales",
    "Dermatología",
    "Oftalmología",
    "Oncología",
    "Traumatología",
  ];

  for (const name of specialties) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Especialidades sembradas: ${specialties.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
