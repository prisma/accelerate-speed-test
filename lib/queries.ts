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

interface FetchOptions {
  runHeavyQuery: boolean;
  cacheQuery: boolean;
}

export async function fecthData({ runHeavyQuery, cacheQuery }: FetchOptions) {
  const res = await prisma.linkOpen
    .count({
      cacheStrategy: cacheQuery ? { ttl: 60 * 60 * 24 } : undefined,
      take: runHeavyQuery ? undefined : 1,
      where: {
        link: {
          User: {
            email: {
              contains: ".net",
            },
          },
        },
      },
    })
    .withAccelerateInfo();

  const cacheStatus = res.info?.cacheStatus;
  return cacheStatus == "ttl" || cacheStatus == "swr" ? 1 : 0;
}
