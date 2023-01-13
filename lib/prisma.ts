import { PrismaClient } from "@prisma/client";
import useAccelerate from "@prisma/extension-accelerate";

function makePrisma() {
  return new PrismaClient({
    datasources: { db: { url: process.env.ACCELERATE_URL } },
  }).$extends(useAccelerate);
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof makePrisma>;
};

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = makePrisma();
