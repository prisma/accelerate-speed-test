import { NextRequest } from "next/server"; // still used for type, but comes from next/server

const ENDPOINT = process.env.GRAFANA_ENDPOINT;
const USER_ID = process.env.GRAFANA_USER_ID;
const API_KEY = process.env.GRAFANA_API_KEY;

/**
 * Sends analytics to Grafana Cloud using InfluxDB line protocol.
 * Works on Cloudflare Pages using next-on-pages.
 */
export async function sendAnalytics(
  measure:
    | "accelerate.demo.ping"
    | "accelerate.demo.stream"
    | "accelerate.demo.time",
  fields: Record<string, number>,
  req: NextRequest,
  tags: Record<string, string> = {}
): Promise<void> {
  if (!ENDPOINT || !USER_ID || !API_KEY) return;

  // Cloudflare injects geolocation into the `cf` object on the native Request
  const cf =
    (req as unknown as Request & { cf?: Record<string, any> }).cf || {};
  const vercelEdgeRegion = cf.colo || "";

  const timestamp = Date.now() * 1_000_000;
  const defaultTags = {
    city: cf.city,
    country: cf.country,
    continent: cf.continent,
    region: cf.region,
    latitude: cf.latitude?.toString(),
    longitude: cf.longitude?.toString(),
    timezone: cf.timezone,
    vercelEdgeRegion,
    colo: vercelEdgeRegion.replace(/[0-9]+/, "").toUpperCase(),
  };

  const tag = Object.entries({ ...defaultTags, ...tags })
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}=${value.replaceAll(" ", `\\ `)}`)
    .join(",");

  const field = Object.entries(fields)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(",");

  const line = `${measure}${tag ? `,` : ""}${tag} ${field} ${timestamp}`;
  console.log(line);

  const response = await fetch(ENDPOINT, {
    method: "POST",
    body: line,
    headers: {
      Authorization: `Bearer ${USER_ID}:${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.text();
    console.error(response.status, data);
  }
}
