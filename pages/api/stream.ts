import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { fecthData, fetchSomeData } from "../../lib/queries";
import { sendAnalytics } from "../../lib/telemetry";

export const config = {
  runtime: "edge", // required for Vercel Edge Function
};

const objToString = (obj: Object) => JSON.stringify(obj);

export default async function handler(req: NextRequest, event: NextFetchEvent) {
  // ✅ Non-blocking cache preheat
  event.waitUntil(fetchSomeData(true));

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
                withCache,
                withoutCache,
                ctx: {
                  geo: req.geo,
                },
              },
            })
          )
        );

        // ✅ Non-blocking analytics dispatch
        event.waitUntil(
          sendAnalytics(
            "accelerate.demo.stream",
            { withCache, withoutCache },
            req
          )
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

type TestRunResult = {
  duration: number;
  cacheStatus: number;
};

async function p50(
  fn: () => Promise<number>,
  cb: (result: TestRunResult) => void,
  signal: AbortSignal
): Promise<number> {
  const results: TestRunResult[] = [];

  while (!signal.aborted) {
    const [duration, cacheStatus] = await time(fn);
    if (!signal.aborted) {
      results.push({ duration, cacheStatus });
      cb({ duration, cacheStatus });
    }
  }

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
