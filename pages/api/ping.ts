import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { fetchSomeData } from "../../lib/queries";
import { sendAnalytics } from "../../lib/telemetry";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, event: NextFetchEvent) {
  const [withCache, withoutCache] = await Promise.all([
    time(() => fetchSomeData(true)),
    time(() => fetchSomeData(false)),
  ]);
  event.waitUntil(
    sendAnalytics("accelerate.demo.ping", { withCache, withoutCache }, req)
  );
  return NextResponse.json(
    { withCache, withoutCache },
    {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    }
  );
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}
