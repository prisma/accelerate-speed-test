import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSomeData } from "../../lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // preheat the cache 🔥
  await fetchSomeData(true);
  // cache store is non-blocking, so give it a second
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const timeout = AbortSignal.timeout(5_000);

  const [withCache, withoutCache] = await Promise.all([
    p50(() => fetchSomeData(true), timeout),
    p50(() => fetchSomeData(false), timeout),
  ]);

  res.status(200).json({ withCache, withoutCache });
}

/**
 * Runs the specified async function until the signal is aborted.
 * Each execution is timed and recorded.
 * Resolves with the P50 duration.
 */
async function p50(
  fn: () => Promise<void>,
  signal: AbortSignal
): Promise<number> {
  const durations = new Array<number>();
  while (!signal.aborted) {
    const duration = await time(fn);
    if (!signal.aborted) {
      durations.push(duration);
    }
  }
  return durations.sort().at(Math.floor(durations.length * 0.5)) ?? NaN;
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}
