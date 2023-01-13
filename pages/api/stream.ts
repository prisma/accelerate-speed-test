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

  const timeout = AbortSignal.timeout(10_000);

  const [withCache, withoutCache] = await Promise.all([
    count(
      () => fetchSomeData(true),
      (duration) => res.write(`data: withCache|${duration}\n\n`),
      timeout
    ),
    count(
      () => fetchSomeData(false),
      (duration) => res.write(`data: withoutCache|${duration}\n\n`),
      timeout
    ),
  ]);

  res.write(`data: end|${withCache}|${withoutCache}`);
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
