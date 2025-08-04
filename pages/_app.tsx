import "../styles/index.scss";

import type { AppProps } from "next/app";
import { LensProvider } from "@prisma/lens/dist/web";
import Head from "next/head";
import Script from 'next/script'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LensProvider>
      <Script src="https://kit.fontawesome.com/e87031b682.js" crossOrigin="anonymous" async></Script>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </LensProvider>
  );
}
