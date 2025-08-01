/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // This applies the header to all routes in your app.
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://kit.fontawesome.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "font-src 'self' data: https://kit.fontawesome.com; " +
              "connect-src 'self' https://vitals.vercel-insights.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
