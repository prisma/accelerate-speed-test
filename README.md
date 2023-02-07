# Accelerate Speed Test

This app demonstrates the performance benefits of [Accelerate](https://www.prisma.io/data-platform/accelerate), a new Early Access product by Prisma. Accelerate provides a global cache with built-in connection pooling.

The Accelerate Speed Test is a Next.js app using Edge API Routes to serve cached data at the edge. When the speed test begins it will start two concurrent tests, one with cache and one without, that will each run as many sequential Prisma `count` operations as they can. The results are streamed to the UI and displayed for comparison.

## Setup

To run the Accelerate Speed Test locally or deploy it yourself, you'll first need an invitation to Accelerate Early Access. [Join the waitlist](https://www.prisma.io/data-platform/accelerate) if you haven't already.

Next, you'll need a database. The Prisma Schema in this repository uses PostgreSQL, but you can substitute it with another database if desired. Create a new Accelerate project for the database to retrieve an Accelerate connection string.

Once you have an Accelerate connection string, create a `.env` file with `DATABASE_URL` set to your direct database connection and `ACCELERATE_URL` set to the Accelerate connection string. This will allow you to push schema changes to your database directly while using Accelerate in the app. Run `npx prisma db push` to sync the schema changes with your database.

```
DATABASE_URL="postgresql://..."
ACCELERATE_URL="prisma://accelerate.prisma-data.net..."
```

You should now be ready to start the app with `npm run dev`. Since the speed test runs a count operation, it can be helpful to load your database with a number of fake records. We used 500,000 LinkOpen entries, but the performance difference gets more dramatic as the number climbs. The more records you add, the more the database has to work to count them, but cache hits will avoid the database altogether and maintain a consistent latency regardless. The latency is also affected by the app's distance from the database. The cache being at the edge maintains stable performance for cache hits regardless of the database proximity.
