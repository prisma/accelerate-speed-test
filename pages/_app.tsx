import type { AppProps } from "next/app";
import { LensProvider } from "@prisma/lens";
import Head from "next/head";
import "../styles/index.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LensProvider>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </LensProvider>
  );
}
