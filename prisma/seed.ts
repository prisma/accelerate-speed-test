import { faker } from "@faker-js/faker";
import { prisma } from "../lib/prisma";

const main = async () => {
  const batches = 500;
  const batchSize = 1_000;
  for (let index = 0; index < batches; index++) {
    console.info(`batch ${index + 1}/${batches}`);
    const users = await prisma.user.createManyAndReturn({
      data: Array.from({ length: batchSize }, () => {
        return {
          email: faker.internet.exampleEmail(),
          name: faker.internet.displayName(),
        };
      }),
    });
    const links = await prisma.link.createManyAndReturn({
      data: users.map((user) => {
        return {
          url: faker.internet.url(),
          shortUrl: faker.internet.url(),
          userId: user.id,
        };
      }),
    });
    await prisma.linkOpen.createMany({
      data: links.map((link) => {
        return { linkId: link.id };
      }),
    });
  }
};

main().then(() => console.log("Done seeding"));
