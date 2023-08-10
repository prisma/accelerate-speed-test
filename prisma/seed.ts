import { prisma } from "../lib/prisma";
import { faker } from "@faker-js/faker";

const main = async () => {
  //   for (let index = 0; index < 500_000; index++) {
  //     await prisma.user.create({
  //       data: {
  //         email: faker.internet.exampleEmail(),
  //         name: faker.internet.displayName(),
  //         links: {
  //           create: {
  //             url: faker.internet.url(),
  //             shortUrl: faker.internet.url(),
  //             LinkOpen: {
  //               create: {},
  //             },
  //           },
  //         },
  //       },
  //     });
  //   }
};

main().then(() => console.log("Done seeding"));
