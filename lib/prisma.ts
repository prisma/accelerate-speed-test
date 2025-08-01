import { PrismaClient } from "../prisma/generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

function makePrisma() {
  return new PrismaClient().$extends(withAccelerate());
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof makePrisma>;
};

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = makePrisma();
