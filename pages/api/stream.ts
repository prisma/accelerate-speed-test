import { NextRequest, NextResponse } from "next/server";
import { fetchSomeData } from "../../lib/queries";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  // preheat the cache 🔥
  await fetchSomeData(true);
  // cache store is non-blocking, so give it a second
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const timeout = AbortSignal.timeout(5_000);

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      await Promise.all([
        p50(
          () => fetchSomeData(true),
          (duration) => {
            controller.enqueue(encoder.encode(`event: withCache\n`));
            controller.enqueue(encoder.encode(`data: ${duration}\n\n`));
          },
          timeout
        ),
        p50(
          () => fetchSomeData(false),
          (duration) => {
            controller.enqueue(encoder.encode(`event: withoutCache\n`));
            controller.enqueue(encoder.encode(`data: ${duration}\n\n`));
          },
          timeout
        ),
      ]).then(async ([withCache, withoutCache]) => {
        controller.enqueue(encoder.encode(`event: stop\n`));
        controller.enqueue(
          encoder.encode(`data: ${withCache}|${withoutCache}`)
        );
        controller.close();
      });
    },
  });

  return new NextResponse(body, {
    headers: {
      "Content-Encoding": "none",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
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
  const start = Date.now();
  await fn();
  return Date.now() - start;
}
