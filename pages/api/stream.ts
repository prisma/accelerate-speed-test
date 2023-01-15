import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSomeData } from "../../lib/queries";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.writeHead(200, {
    "Content-Encoding": "none",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });

  // preheat the cache 🔥
  await fetchSomeData(true);
  // cache store is non-blocking, so give it a second
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const timeout = AbortSignal.timeout(10_000);

  const [withCache, withoutCache] = await Promise.all([
    p50(
      () => fetchSomeData(true),
      (duration) => res.write(`data: withCache|${duration}\n\n`),
      timeout
    ),
    p50(
      () => fetchSomeData(false),
      (duration) => res.write(`data: withoutCache|${duration}\n\n`),
      timeout
    ),
  ]);

  res.write(`data: end|${withCache}|${withoutCache}`);
}

/**
 * Runs the specified async function until the signal is aborted.
 * Each execution is timed, recorded, and emitted to the specified callback.
 * Resolves with the P50 duration.
 */
async function p50(
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
  return durations.sort().at(Math.floor(durations.length * 0.5)) ?? NaN;
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}
