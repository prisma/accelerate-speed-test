import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { fecthData, fetchSomeData } from "../../lib/queries";
import { sendAnalytics } from "../../lib/telemetry";

export const config = {
  runtime: "edge",
};

const objToString = (obj: Object) => {
  return JSON.stringify(obj);
};

export default async function handler(req: NextRequest, event: NextFetchEvent) {
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
          () =>
            fecthData({
              cacheQuery: true,
              runHeavyQuery: true,
            }),
          ({ duration, cacheStatus }) => {
            controller.enqueue(
              encoder.encode(
                objToString({
                  event: "withCache",
                  data: {
                    duration,
                    cacheStatus,
                  },
                })
              )
            );
          },
          timeout
        ),
        p50(
          () =>
            fecthData({
              cacheQuery: false,
              runHeavyQuery: true,
            }),
          ({ duration }) => {
            controller.enqueue(
              encoder.encode(
                objToString({
                  event: "withoutCache",
                  data: {
                    duration,
                    cacheStatus: null,
                  },
                })
              )
            );
          },
          timeout
        ),
      ]).then(async ([withCache, withoutCache]) => {
        controller.enqueue(
          encoder.encode(
            objToString({
              event: "stop",
              data: {
                withCache: withCache,
                withoutCache: withoutCache,
                ctx: {
                  geo: req.geo,
                },
              },
            })
          )
        );
        event.waitUntil(
          sendAnalytics(
            "accelerate.demo.stream",
            { withCache, withoutCache },
            req
          )
        );
        controller.close();
        return [withCache, withoutCache];
      });
    },
  });

  return new NextResponse(body, {
    headers: {
      "Content-Encoding": "none",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

type TestRunResult = {
  duration: number;
  cacheStatus: number;
};

/**
 * Runs the specified async function until the signal is aborted.
 * Each execution is timed, recorded, and emitted to the specified callback.
 * Resolves with the P50 duration.
 */
async function p50(
  fn: () => Promise<number>,
  cb: (result: TestRunResult) => void,
  signal: AbortSignal
): Promise<number> {
  const results = new Array<TestRunResult>();

  while (!signal.aborted) {
    const [duration, cacheStatus] = await time(fn);
    if (!signal.aborted) {
      results.push({ duration, cacheStatus });
      cb({ duration, cacheStatus });
    }
  }

  const { hit, miss } = results
    .map((item) => item.cacheStatus)
    .reduce(
      (prev, curr) => {
        return {
          hit: prev.hit + (curr == 1 ? 1 : 0),
          miss: prev.miss + (curr == 0 ? 1 : 0),
        };
      },
      { hit: 0, miss: 0 }
    );

  return (
    results
      .map((r) => r.duration)
      .sort((a, b) => a - b)
      .at(Math.floor(results.length * 0.5)) ?? NaN
  );
}

async function time(fn: () => Promise<number>): Promise<[number, number]> {
  const start = Date.now();
  const cacheStatus = await fn();
  return [Date.now() - start, cacheStatus];
}
