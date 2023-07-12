import type { AppProps } from "next/app";
import { LensProvider, Headings } from "@prisma/lens/dist/web";
import Head from "next/head";
import "../styles/index.scss";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LensProvider>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <script src="https://kit.fontawesome.com/e87031b682.js" crossOrigin="anonymous" async></script>
      </Head>
      <Headings />
      <Component {...pageProps} />
    </LensProvider>
  );
}
