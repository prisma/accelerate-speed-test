const ENDPOINT = process.env.GRAFANA_ENDPOINT;
const USER_ID = process.env.GRAFANA_USER_ID;
const API_KEY = process.env.GRAFANA_API_KEY;

export async function sendAnalytics(
  measure: string,
  fields: Record<string, number>,
  tags: Record<string, string> = {}
): Promise<void> {
  if (ENDPOINT) {
    const timestamp = Date.now() * 1_000_000;
    const tag = Object.entries(tags)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`
      )
      .join(",");
    const field = Object.entries(fields)
      .map(([key, value]) => `${encodeURIComponent(key)}="${value}"`)
      .join(",");
    const line = `${measure},${tag} ${field} ${timestamp}`;
    const response = await fetch(ENDPOINT, {
      method: "post",
      body: line,
      headers: {
        Authorization: `Bearer ${USER_ID}:${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(response.status, data);
  }
}
