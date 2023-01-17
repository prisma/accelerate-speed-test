import { NextRequest, NextResponse } from "next/server";
import { fetchSomeData } from "../../lib/queries";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const duration = await time(() => fetchSomeData(true));
  return NextResponse.json({ duration });
}

async function time(fn: () => Promise<unknown>): Promise<number> {
  const start = Date.now();
  await fn();
  return Date.now() - start;
}
