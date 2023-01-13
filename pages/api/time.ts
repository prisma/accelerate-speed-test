import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSomeData } from "../../lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // preheat the cache 🔥
  await fetchSomeData(true);

  const [withCache, withoutCache] = await Promise.all([
    p50(() => fetchSomeData(true)),
    p50(() => fetchSomeData(false)),
  ]);

  res.status(200).json({ withCache, withoutCache });
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

async function p50(fn: () => Promise<unknown>): Promise<number> {
  const results = new Array<number>();
  while (results.length < 1) {
    results.push(await time(fn));
  }
  return results.at(Math.floor(results.length * 0.5)) ?? 0;
}
