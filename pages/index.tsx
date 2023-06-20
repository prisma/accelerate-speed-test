import { Button, Code, Title } from "@prisma/lens";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import DatabaseInfo from "../components/DatabaseInfo";
import { AiFillGithub, AiOutlineGithub } from "react-icons/ai";
import { CacheAnimation } from "../components/CacheIllustration";

const num = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const ms = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "unit",
  unit: "millisecond",
  unitDisplay: "short",
});

const time = new Intl.DateTimeFormat("default", {
  hour: "numeric",
  minute: "numeric",
  hour12: false,
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
  const [history, setHistory] = useState<Record[]>([]);
  const [state, setState] = useState<"idle" | "running" | "complete" | "error">(
    "idle"
  );
  const [cacheLatency, setCacheLatency] = useState(0);
  const [withoutCacheLatency, setWithoutCacheLatency] = useState(0);

  async function runTest() {
    setCacheLatency(0);
    setWithoutCacheLatency(0);
    setState("running");

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
      await fetch("/api/stream").then(async (response) => {
        if (!response.body) {
          setState("error");
          return;
        }
        for await (const { event, data } of readStream(response.body)) {
          switch (event) {
            case "stop": {
              setWithoutCacheLatency(data.withoutCache);
              setCacheLatency(data.withCache);
              setHistory((prev) =>
                [
                  {
                    time: time.format(new Date()),
                    location:
                      `${[data.ctx.geo?.city, data.ctx.geo?.country]
                        .filter(Boolean)
                        .join(", ")}` || `Not available`,
                    withCache: {
                      latency: ms.format(data.withCache),
                      qpm: num.format((1_000 / data.withCache) * 60),
                    },
                    withoutCache: {
                      latency: ms.format(data.withoutCache),
                      qpm: num.format((1_000 / data.withoutCache) * 60),
                    },
                    speedup: num.format(data.withoutCache / data.withCache),
                  },
                ].concat(prev)
              );
              break;
            }
            case "withCache": {
              setCacheLatency(data.duration);
              break;
            }
            case "withoutCache": {
              setWithoutCacheLatency(data.duration);
              break;
            }
          }
        }
        setState("complete");
      });
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <nav>
          <Image alt="Prisma logo" src="/logo.svg" width={105} height={32} />
          <span className="badge">Early Access</span>
          <span style={{ flex: 1 }}></span>
          <a
            href="https://github.com/prisma/accelerate-speed-test"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AiFillGithub size={25} />
          </a>
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
            The speed test involved running a count query on a 500k row dataset
            with and without an Accelerate cache. The database was hosted in one
            region, while requests were made from Vercel edge functions. The
            experiment proves that Accelerate offers faster queries and serves
            data from the nearest cache server to the edge function location,
            avoiding the need for a time-consuming round trip to fetch data from
            the database in N. Virginia (us-east-1).
          </p>
        </header>

        <section style={{ gridArea: "action" }}>
          <Button
            autoFocus
            isDisabled={state === "running"}
            onPress={runTest}
            onClick={runTest}
            variant={state === "error" ? "negative" : "primary"}
            type="button"
          >
            {state === "idle" && "Run Accelerate speed test"}
            {state === "running" && "Running Accelerate speed test"}
            {state === "complete" && "Run another test"}
            {state === "error" && "Try Again"}
          </Button>
        </section>
        <section className={`card ${state}`} style={{ gridArea: "cache" }}>
          <CacheAnimation
            skipCache={false}
            location={history?.[0]?.location ?? null}
          />
          <h2>✅ With Accelerate</h2>
          <p>
            Significantly reduce computational overhead by caching, eliminating
            the need to scan ~500k rows per query.
          </p>

          <dl>
            <dd>{num.format((1_000 / cacheLatency) * 60)}</dd>
            <dt>queries per minute</dt>
          </dl>
          <dl>
            <dd>{ms.format(cacheLatency)}</dd>
            <dt>latency</dt>
          </dl>
          <ul>
            <li>✨ Reduced latency</li>
            <li>🚀 Increased Query Capacity</li>
            <li>🌟 Optimal Resource Utilization</li>
          </ul>
          <span className="badge green">Cached query</span>
          <Code className="code" value={CODE_CACHE} />
        </section>
        <section className={`card ${state}`} style={{ gridArea: "noCache" }}>
          <CacheAnimation skipCache location={history?.[0]?.location ?? null} />
          <h2>❌ Without Accelerate</h2>
          <p>
            Computationally expensive as it performs a scan on ~500k rows on
            every query
          </p>
          <dl>
            <dd>{num.format((1_000 / withoutCacheLatency) * 60)}</dd>
            <dt>queries per minute</dt>
          </dl>
          <dl>
            <dd>{ms.format(withoutCacheLatency)}</dd>
            <dt>latency</dt>
          </dl>
          <ul>
            <li>🐢 High latency</li>
            <li>🪫 Low Query Capacity</li>
            <li>🚧 Poor Resource Utilization</li>
          </ul>
          <span className="badge gray">Non-cached query</span>
          <Code className="code" value={CODE_NO_CACHE} />
        </section>
        <section className="results">
          <h2>Speed test history</h2>
          {history.length === 0 ? (
            <p>No tests ran yet</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th id="time">Time</th>
                  <th id="location">Location</th>
                  <th id="accelerate-qpm">Accelerate #qpm</th>
                  <th id="non-cached-qpm">Non-cached #qpm</th>
                  <th id="accelerate-latency">Accelerate latency</th>
                  <th id="non-cached-latency">Non-cached latency</th>
                  <th id="speedup">Speedup</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, i) => (
                  <tr key={i}>
                    <td headers="time">{record.time}</td>
                    <td title={record.location} headers="location">
                      {record.location}
                    </td>
                    <td headers="accelerate-qpm">
                      <span className="badge green">
                        {record.withCache.qpm}
                      </span>
                    </td>
                    <td headers="non-cached-qpm">
                      <span className="badge red">
                        {record.withoutCache.qpm}
                      </span>
                    </td>
                    <td headers="accelerate-latency">
                      <span className="badge green">
                        {record.withCache.latency}
                      </span>
                    </td>
                    <td headers="non-cached-latency">
                      <span className="badge red">
                        {record.withoutCache.latency}
                      </span>
                    </td>
                    <td headers="speedup">{record.speedup}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="info">
          <h2>Database instance used</h2>
          <DatabaseInfo />
        </section>
      </main>
    </>
  );
}

type RunningResult = {
  event: "withCache" | "withoutCache";
  data: {
    duration: number;
    cacheStatus: number;
  };
};

type FinishResult = {
  event: "stop";
  data: {
    withCache: number;
    withoutCache: number;
    ctx: {
      geo:
        | {
            city?: string | undefined;
            country?: string | undefined;
            region?: string | undefined;
            latitude?: string | undefined;
            longitude?: string | undefined;
          }
        | undefined;
    };
  };
};

type Record = {
  time: string;
  location: string | "not available";
  withCache: {
    latency: string;
    qpm: string;
  };
  withoutCache: {
    latency: string;
    qpm: string;
  };
  speedup: string;
};
