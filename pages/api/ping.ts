import { geolocation } from "@vercel/edge";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { fetchSomeData } from "../../lib/queries";
import { sendAnalytics } from "../../lib/telemetry";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest, event: NextFetchEvent) {
  const duration = await time(() => fetchSomeData(true));
  event.waitUntil(
    sendAnalytics(
      "accelerate.demo.ping",
      { duration },
      { ...req.geo, colo: geolocation(req).region ?? "" }
    )
  );
  return NextResponse.json({ duration });
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}
