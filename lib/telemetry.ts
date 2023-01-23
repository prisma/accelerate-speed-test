const ENDPOINT = process.env.GRAFANA_ENDPOINT;
const USER_ID = process.env.GRAFANA_USER_ID;
const API_KEY = process.env.GRAFANA_API_KEY;

/**
 * Sends analytics to Grafana Cloud using InfluxDB line protocol.
 * Grafana Cloud does not support pushing analytics via OpenTelemetry HTTP.
 * @see https://grafana.com/docs/grafana-cloud/data-configuration/metrics/metrics-influxdb/push-from-telegraf/#pushing-from-applications-directly
 * @see https://docs.influxdata.com/influxdb/v2.6/reference/syntax/line-protocol/
 * @param measure The name of the analytics event
 * @param fields Values recordings
 * @param tags Attributes to index
 */
export async function sendAnalytics(
  measure:
    | "accelerate.demo.ping"
    | "accelerate.demo.stream"
    | "accelerate.demo.time",
  fields: Record<string, number>,
  tags: Record<string, string> = {}
): Promise<void> {
  if (ENDPOINT) {
    const timestamp = Date.now() * 1_000_000;
    const tag = Object.entries(tags)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${key}="${value}"`)
      .join(",");
    const field = Object.entries(fields)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(",");
    const line = `${measure}${tag ? `,` : ""}${tag} ${field} ${timestamp}`;
    console.log(line);
    const response = await fetch(ENDPOINT, {
      method: "post",
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
}
