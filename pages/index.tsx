import { Body, defaultTheme, H2, H3, Icon, Subtitle, WebsiteButton } from "@prisma/lens/dist/web";
import * as reactCanvas from "@rive-app/react-canvas";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

import { DatabaseInfo, DatabaseInfoMobile } from "../components/DatabaseInfo";
import { GithubIcon } from "../components/GithubIcon";
import styles from "../styles/index.module.scss";

const Animation = ({
  state,
  name,
  className,
  fit,
  badge,
  badge2,
  badgeVirginia,
}: any) => {
  const { rive, RiveComponent } = reactCanvas.useRive({
    src: `/animations/${name}.riv`,
    autoplay: false,
    layout: new reactCanvas.Layout({
      fit: fit,
      alignment: reactCanvas.Alignment.Center,
    }),
  });

  useEffect(() => {
    if (state === "running") {
      rive?.play();
    } else {
      rive?.pause();
    }
  }, [state]);

  return (
    <div className={className}>
      {badge}
      {badge2}
      {badgeVirginia}
      <RiveComponent />
    </div>
  );
};

const pageInfo = [
  {
    title: "Application",
    description: (
      <div>
        Built with Next.js (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/vercel/next.js/"
        >
          GitHub
        </a>
        )
      </div>
    ),
    icon: <GithubIcon />,
  },
  {
    title: "Deployment",
    description: <div>Vercel Edge Functions</div>,
    icon: "/vercel.svg",
  },
  {
    title: "Database",
    description: (
      <div>
        <span>PostgreSQL </span>(
        <span className={styles.badgeYellow}>
          <img
            src="/locationDot.svg"
            color={defaultTheme.colors.orange[400]}
            width="8px"
            height="15px"
          />
          <span>US-EAST-1</span>
        </span>
        )
      </div>
    ),
    icon: "/database.svg",
  },
];
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

const CODE_CACHE = (
  <>
    {`
await prisma.linkOpen.count({`}
    <span>{`  cacheStrategy: { ttl: 3_600 },`} </span>
    {`  where: {
    link: {
      User: {
        email: {
          contains: ".com",
        },
      },
    },
  },
});
`}
  </>
);

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

const socialLinks = [
  {
    id: "discord",
    link: "https://pris.ly/discord",
  },
  {
    id: "github",
    link: "https://github.com/prisma",
  },
  {
    id: "twitter",
    link: "https://twitter.com/prisma",
  },
  {
    id: "youtube",
    link: "https://www.youtube.com/c/PrismaData",
  },
];

export default function Home() {
  const [history, setHistory] = useState<Record[]>([]);
  const [state, setState] = useState<"idle" | "running" | "complete" | "error">(
    "idle"
  );
  const [cacheLatency, setCacheLatency] = useState(0);
  const [withoutCacheLatency, setWithoutCacheLatency] = useState(0);

  const [showWith, toggleWith] = useState<boolean>(false);

  useEffect(() => {
    // warm up edge functions
    const abortController = new AbortController();

    Promise.all([
      fetch("/api/stream", { signal: abortController.signal }),
      fetch("/api/stream", { signal: abortController.signal }),
    ])
      .then(() => {})
      .catch(() => {});

    return () => {
      abortController.abort(); // Cancel the fetch requests
    };
  }, []);

  async function runTest() {
    window.location.hash = "#testArea";
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
      <main className={styles.main}>
        <div className={styles.nav}>
          <a href="https://www.prisma.io/">
            <Image alt="Prisma logo" src="/logo.svg" width={105} height={32} />
          </a>
          <span style={{ flex: 1 }}></span>
          <a
            href="https://github.com/prisma/accelerate-speed-test"
            target="_blank"
            className={styles.githubIcon}
            rel="noopener noreferrer"
          >
            <GithubIcon />
          </a>
          <WebsiteButton
            href="https://console.prisma.io/login?utm_source=accelerate-speedtest"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waitlistbtn}
            color="teal"
            type="secondary"
          >
            Get Started
          </WebsiteButton>
        </div>
        <header className={styles.header}>
          <p className={styles["eyebrow-headline"]}>
            Accelerate
          </p>
          <H2 className={styles.h2}>
            Speed up your database queries with an automated global cache
          </H2>
          <Body>
            <p>
              This speed test runs a simple count query on a dataset with 500k
              rows and shows the results with and without the{" "}
              <a
                href="https://www.prisma.io/data-platform/accelerate?utm_source=accelerate-speedtest"
                target="_blank"
                rel="noopener noreferrer"
              >
                Accelerate
              </a>{" "}
              cache.
            </p>
          </Body>
        </header>

        <div className={styles.testBtn}>
          <WebsiteButton
            color="teal"
            className={state === "running" ? styles.runningBtn : ""}
            onClick={() => runTest()}
          >
            {state === "idle" && "Run Accelerate speed test"}
            {state === "running" && "Running Accelerate speed test"}
            {state === "complete" && "Run another test"}
            {state === "error" && "Try Again"}
            
            <img src={state === "running" ? "/arrow-rotate-right.svg" : "/arrow-down.svg"} />
          </WebsiteButton>
        </div>

        <div className={styles.pageInfo}>
          {pageInfo.map((e: any, idx: number) => (
            <div key={idx}>
              <div className={styles.squareIcon}>
                {typeof e.icon === "string" ? (
                  <img src={e.icon} width="24px" height="24px" />
                ) : (
                  e.icon
                )}
              </div>
              <Body
                className={styles.infoText}
                style={{ fontFamily: defaultTheme.fonts.heading }}
              >
                <span>{e.title}</span>
                <div>{e.description}</div>
              </Body>
            </div>
          ))}
        </div>
        <div className={styles.testArea} id="testArea">
          <div className={styles.withAccelerate}>
            <H3>
              <img src="/bolt.svg" /> With Accelerate Cache
            </H3>
            <div className={styles.illustrationSection}>
              <Animation
                autoplay={false}
                state={state}
                name="with-accelerate"
                className={styles.animation}
                fit={reactCanvas.Fit.FitWidth}
                badge={
                  <span
                    className={styles.badgeYellow}
                    style={{ top: "-30px", left: "6%" }}
                  >
                    <img
                      src="/locationDot.svg"
                      color={defaultTheme.colors.orange[400]}
                      width="8px"
                      height="15px"
                    />
                    {history?.[0]?.location ? (
                      <span>{history?.[0]?.location}</span>
                    ) : null}
                  </span>
                }
                badge2={
                  <span
                    className={styles.badgeYellow}
                    style={{ top: "-30px", left: "35%" }}
                  >
                    <img
                      src="/locationDot.svg"
                      color={defaultTheme.colors.orange[400]}
                      width="8px"
                      height="15px"
                    />
                    {history?.[0]?.location ? (
                      <span>{history?.[0]?.location}</span>
                    ) : null}
                  </span>
                }
                badgeVirginia={
                  <span className={`${styles.badgeYellow} ${styles.virginia}`}>
                    <img
                      src="/locationDot.svg"
                      color={defaultTheme.colors.orange[400]}
                      width="8px"
                      height="15px"
                    />
                    <span>n.virginia</span>
                  </span>
                }
              />
            </div>
            <Body className={styles.cardInfo}>
              <div className={styles.numbers}>
                <h4>{num.format((1_000 / cacheLatency) * 60)}</h4>
                <span>queries per minute</span>
              </div>
              <div className={styles.numbers}>
                <h4>{ms.format(cacheLatency)}</h4>
                <span>latency</span>
              </div>
              <p>
                The result of the database query is cached at the Accelerate
                caching node in&nbsp;
                <span className={styles.badgeYellow}>
                  <img
                    src="/locationDot.svg"
                    color={defaultTheme.colors.orange[400]}
                    width="8px"
                    height="15px"
                  />
                  {<span>N.VIRGINIA</span>}
                </span>
                &nbsp;and retrieved from there:
              </p>
              <ul>
                <li>✨ Reduced latency</li>
                <li>🚀 Increased Query Capacity</li>
                <li>🌟 Optimal Resource Utilization</li>
              </ul>
              <div
                className={`${styles.expandBar} ${styles.with} ${
                  showWith && styles.active
                }`}
                onClick={() => toggleWith(!showWith)}
              >
                Expand&nbsp;<span className={styles.mobile}> to view</span>{" "}
                Prisma Client query
              </div>
              <pre className={`${styles.code} ${!showWith && styles.hide}`}>
                <code>{CODE_CACHE}</code>
              </pre>
            </Body>
          </div>
          <div className={styles.withoutAccelerate}>
            <H3>
              <img src="/clock.svg" /> Without Accelerate Cache
            </H3>
            <div className={styles.illustrationSection}>
              <Animation
                autoplay={false}
                name="without-accelerate"
                state={state}
                className={styles.animation}
                fit={reactCanvas.Fit.FitWidth}
                badge={
                  <span
                    className={styles.badgeYellow}
                    style={{ top: "-30px", left: "6%" }}
                  >
                    <img
                      src="/locationDot.svg"
                      color={defaultTheme.colors.orange[400]}
                      width="8px"
                      height="15px"
                    />
                    {history?.[0]?.location ? (
                      <span>{history?.[0]?.location}</span>
                    ) : null}
                  </span>
                }
                badgeVirginia={
                  <span className={`${styles.badgeYellow} ${styles.virginia}`}>
                    <img
                      src="/locationDot.svg"
                      color={defaultTheme.colors.orange[400]}
                      width="8px"
                      height="15px"
                    />
                    <span>N.VIRGINIA</span>
                  </span>
                }
              />
            </div>
            <Body className={styles.cardInfo}>
              <div className={styles.numbers}>
                <h4>{num.format((1_000 / withoutCacheLatency) * 60)}</h4>
                <span>queries per minute</span>
              </div>
              <div className={styles.numbers}>
                <h4>{ms.format(withoutCacheLatency)}</h4>
                <span>latency</span>
              </div>
              <p>
                The database query and its response need to travel to the
                database in&nbsp;
                <span className={styles.badgeYellow}>
                  <img
                    src="/locationDot.svg"
                    color={defaultTheme.colors.orange[400]}
                    width="8px"
                    height="15px"
                  />
                  {<span>N.VIRGINIA</span>}
                </span>
                &nbsp;and retrieved from there:
              </p>
              <ul>
                <li>🐢 High latency</li>
                <li>🪫 Low Query Capacity</li>
                <li>🚧 Poor Resource Utilization</li>
              </ul>
              <div
                className={`${styles.expandBar} ${styles.without} ${
                  showWith && styles.active
                }`}
                onClick={() => toggleWith(!showWith)}
              >
                Expand&nbsp;
                <span className={styles.mobile}> to view&nbsp;</span>Prisma
                Client query
              </div>
              <pre className={`${styles.code} ${!showWith && styles.hide}`}>
                <code>{CODE_NO_CACHE}</code>
              </pre>
            </Body>
          </div>
        </div>
        <div className={styles.results}>
          <h4>Speed test history</h4>
          {history.length === 0 ? (
            <Body>No tests ran yet</Body>
          ) : (
            <table>
              <thead>
                <tr className={styles.speedGrid}>
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
                  <tr key={i} className={styles.speedGrid}>
                    <td headers="time">{record.time}</td>
                    <td title={record.location} headers="location">
                      {record.location}
                    </td>
                    <td headers="accelerate-qpm">
                      <span className={styles.badgeGreen}>
                        {record.withCache.qpm}
                      </span>
                    </td>
                    <td headers="non-cached-qpm">
                      <span className={styles.badgeRed}>
                        {record.withoutCache.qpm}
                      </span>
                    </td>
                    <td headers="accelerate-latency">
                      <span className={styles.badgeGreen}>
                        {record.withCache.latency}
                      </span>
                    </td>
                    <td headers="non-cached-latency">
                      <span className={styles.badgeRed}>
                        {record.withoutCache.latency}
                      </span>
                    </td>
                    <td headers="speedup">{record.speedup}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className={styles.info}>
          <h4>Database instance used</h4>
          <DatabaseInfo />
          <DatabaseInfoMobile />
        </div>
      </main>
      <footer>
        <div className={styles.footerWrapper}>
          <div className={styles.logo}>
            <Image alt="Prisma logo" src="/logo.svg" width={105} height={32} />
            <Body>© 2023 Prisma Data, Inc.</Body>
          </div>
          <div className={styles.socials}>
            {socialLinks.map((e: any) => (
              <a
                href={e.link}
                target="_blank"
                rel="noopener noreferrer"
                key={e.id}
              >
                <Icon
                  color="currentColor"
                  size="inherit"
                  icon={`fa-brands fa-${e.id}`}
                />
              </a>
            ))}
          </div>
        </div>
      </footer>
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
