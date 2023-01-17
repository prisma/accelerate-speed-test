import { Button, Code, Title } from "@prisma/lens";
import Head from "next/head";
import { useState } from "react";

const num = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const ms = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "unit",
  unit: "millisecond",
  unitDisplay: "short",
});

const CODE = `
await prisma.linkOpen.count({
  cacheStrategy: { ttl: 3_600 },
  where: {
    link: {
      User: {
        email: {
          contains: ".com",
        },
      },
    },
  },
});
`;

export default function Home() {
  const [state, setState] = useState<"idle" | "running" | "complete" | "error">(
    "idle"
  );
  const [cacheLatency, setCacheLatency] = useState(0);
  const [withoutCacheLatency, setWithoutCacheLatency] = useState(0);

  async function runTest() {
    setState("running");

    try {
      const response = await fetch("/api/time");
      const { withCache, withoutCache } = await response.json();
      setCacheLatency(withCache);
      setWithoutCacheLatency(withoutCache);
      setState("complete");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  return (
    <>
      <Head>
        <title>Accelerate Speed Test</title>
        <meta
          name="description"
          content="See the speed of cache hits enabled by Accelerate"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <Title>Accelerate Speed Test</Title>
        <section style={{ gridArea: "cache" }}>
          <h2>With Cache</h2>
          <dl>
            <dd>{num.format((1_000 / cacheLatency) * 60)}</dd>
            <dt>queries per minute</dt>
          </dl>
          <dl>
            <dd>{ms.format(cacheLatency)}</dd>
            <dt>latency</dt>
          </dl>
        </section>
        <section style={{ gridArea: "noCache" }}>
          <h2>Without Cache</h2>
          <dl>
            <dd>{num.format((1_000 / withoutCacheLatency) * 60)}</dd>
            <dt>queries per minute</dt>
          </dl>
          <dl>
            <dd>{ms.format(withoutCacheLatency)}</dd>
            <dt>latency</dt>
          </dl>
        </section>
        <footer>
          <Button
            autoFocus
            isDisabled={state !== "idle" && state !== "error"}
            onClick={runTest}
            variant={state === "error" ? "negative" : "primary"}
            type="button"
          >
            {state === "idle" && "Run Test"}
            {state === "running" && "Running Test..."}
            {state === "complete" && "Complete"}
            {state === "error" && "Try Again"}
          </Button>
        </footer>
        <Code className="code" value={CODE} />
      </main>
    </>
  );
}
