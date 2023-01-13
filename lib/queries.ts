import { prisma } from "./prisma";

export async function fetchSomeData(cache: boolean): Promise<void> {
  await prisma.linkOpen.count({
    cacheStrategy: cache ? { ttl: 60 * 60 * 24 } : undefined,
    where: {
      link: {
        User: {
          email: {
            contains: ".com",
          },
        },
      },
    },
  });
}
