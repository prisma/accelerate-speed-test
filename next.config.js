/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src * 'unsafe-inline' 'unsafe-eval'; " +
              "script-src * 'unsafe-inline' 'unsafe-eval'; " +
              "connect-src * 'unsafe-inline'; " +
              "img-src * data: blob: 'unsafe-inline'; " +
              "frame-src *; " +
              "style-src * 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
