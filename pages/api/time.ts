import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSomeData } from "../../lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // preheat the cache 🔥
  await fetchSomeData(true);

  const timeout = AbortSignal.timeout(5_000);

  const [withCache, withoutCache] = await Promise.all([
    count(
      () => fetchSomeData(true),
      (duration) => {},
      timeout
    ),
    count(
      () => fetchSomeData(false),
      (duration) => {},
      timeout
    ),
  ]);

  res.status(200).json({ withCache, withoutCache });
}

async function count(
  fn: () => Promise<void>,
  cb: (duration: number) => void,
  signal: AbortSignal
): Promise<number> {
  const durations = new Array<number>();
  while (!signal.aborted) {
    const duration = await time(fn);
    if (!signal.aborted) {
      durations.push(duration);
      cb(duration);
    }
  }
  return durations.reduce((prev, curr) => prev + curr, 0) / durations.length;
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}
