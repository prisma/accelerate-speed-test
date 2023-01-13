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
  const [isRunning, setIsRunning] = useState(false);
  const [cacheLatency, setCacheLatency] = useState(0);
  const [withoutCacheLatency, setWithoutCacheLatency] = useState(0);

  async function runTest() {
    setIsRunning(true);

    // SSE doesn't work on Vercel 😞
    // const stream = new EventSource("/api/stream");
    // stream.addEventListener("message", (message) => {
    //   if (message.data.startsWith("withCache")) {
    //     setCacheLatency(Number(message.data.split("|")[1]));
    //   } else if (message.data.startsWith("withoutCache")) {
    //     setWithoutCacheLatency(Number(message.data.split("|")[1]));
    //   } else if (message.data.startsWith("end")) {
    //     stream.close();
    //     setCacheLatency(Number(message.data.split("|")[1]));
    //     setWithoutCacheLatency(Number(message.data.split("|")[2]));
    //   }
    // });

    const response = await fetch("/api/time");
    const { withCache, withoutCache } = await response.json();
    setCacheLatency(withCache);
    setWithoutCacheLatency(withoutCache);
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
            isDisabled={isRunning}
            onClick={runTest}
            type="button"
          >
            Run Test
          </Button>
        </footer>
        <Code className="code" value={CODE} />
      </main>
    </>
  );
}
