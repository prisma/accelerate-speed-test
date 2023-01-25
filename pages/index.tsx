import { Button, Code, Title } from "@prisma/lens";
import Head from "next/head";
import Image from "next/image";
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

const CODE_CACHE = `
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

const CODE_NO_CACHE = `
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
  const [state, setState] = useState<'idle' | 'running' | 'complete' | 'error'>(
    'idle'
  );
  const [cacheLatency, setCacheLatency] = useState(0);
  const [withoutCacheLatency, setWithoutCacheLatency] = useState(0);

  async function runTest() {
    setCacheLatency(0);
    setWithoutCacheLatency(0);
    setState('running');

    async function* readStream(stream: ReadableStream<Uint8Array>) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          const decoded = new TextDecoder().decode(value);
          try {
            const result = JSON.parse(decoded.trim()) as
              | RunningResult
              | FinishResult;
            yield result;
          } catch {
            // continue
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
    try {
      await fetch('/api/stream').then(async (response) => {
        if (!response.body) {
          setState('error');
          return;
        }
        for await (const { event, data } of readStream(response.body)) {
          switch (event) {
            case 'stop': {
              setWithoutCacheLatency(data.withoutCache);
              setCacheLatency(data.withCache);
              break;
            }
            case 'withCache': {
              setCacheLatency(data);
              break;
            }
            case 'withoutCache': {
              setWithoutCacheLatency(data);
              break;
            }
          }
        }
        setState('complete');
      });
    } catch (error) {
      console.error(error);
      setState('error');
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <nav>
          <Image alt="Prisma logo" src="/logo.svg" width={105} height={32} />
          <span className="badge">Early Access</span>
          <span style={{ flex: 1 }}></span>
          <a
            href="https://www.prisma.io/data-platform/accelerate"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary">Join the waitlist</Button>
          </a>
        </nav>
        <header>
          <Title titleProps={{ style: { fontSize: `2rem` } }}>
            Accelerate Speed test
          </Title>
          <p>
            Cache your queries with a line of code. The test will run for ~5
            seconds. See how many requests Accelerate can process sequentially
            over that time.
          </p>
        </header>
        <section style={{ gridArea: 'action' }}>
          <Button
            autoFocus
            isDisabled={state === 'running'}
            onClick={runTest}
            variant={state === 'error' ? 'negative' : 'primary'}
            type="button"
          >
            {state === 'idle' && 'Run Accelerate speed test'}
            {state === 'running' && 'Running Accelerate speed test'}
            {state === 'complete' && 'Run another test'}
            {state === 'error' && 'Try Again'}
          </Button>
        </section>
        <section className={`card ${state}`} style={{ gridArea: 'cache' }}>
          <h2>✅ With Accelerate</h2>
          <dl>
            <dd>{num.format((1_000 / cacheLatency) * 60)}</dd>
            <dt>queries per minute</dt>
          </dl>
          <dl>
            <dd>{ms.format(cacheLatency)}</dd>
            <dt>latency</dt>
          </dl>
          <span className="badge green">Cached query</span>
          <Code className="code" value={CODE_CACHE} />
        </section>
        <section className={`card ${state}`} style={{ gridArea: 'noCache' }}>
          <h2>❌ Without Accelerate</h2>
          <dl>
            <dd>{num.format((1_000 / withoutCacheLatency) * 60)}</dd>
            <dt>queries per minute</dt>
          </dl>
          <dl>
            <dd>{ms.format(withoutCacheLatency)}</dd>
            <dt>latency</dt>
          </dl>
          <span className="badge gray">Uncached query</span>
          <Code className="code" value={CODE_NO_CACHE} />
        </section>
      </main>
    </>
  );
}

type RunningResult = {
  event: 'withCache' | 'withoutCache';
  data: number;
};

type FinishResult = {
  event: 'stop';
  data: {
    withCache: number;
    withoutCache: number;
  };
}; 