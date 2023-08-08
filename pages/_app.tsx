import "../styles/index.scss";

import type { AppProps } from "next/app";
import { LensProvider } from "@prisma/lens/dist/web";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LensProvider>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <script src="https://kit.fontawesome.com/e87031b682.js" crossOrigin="anonymous" async></script>
      </Head>
      <Component {...pageProps} />
    </LensProvider>
  );
}
