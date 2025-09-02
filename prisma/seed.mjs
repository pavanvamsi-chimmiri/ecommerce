import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "Admin", role: "ADMIN" },
  });

  const categories = [
    { name: "Electronics", slug: "electronics" },
    { name: "Home", slug: "home" },
    { name: "Fashion", slug: "fashion" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const category = await prisma.category.findFirst({ where: { slug: "electronics" } });

  if (category) {
    const product = await prisma.product.upsert({
      where: { slug: "sample-phone" },
      update: {},
      create: {
        title: "Sample Phone",
        slug: "sample-phone",
        description: "A great starter device",
        price: 499.99,
        categoryId: category.id,
        images: {
          create: [{ url: "/placeholder.png", alt: "Sample Phone" }],
        },
        inventory: { create: { quantity: 25 } },
      },
    });
    console.log("Seeded product:", product.slug);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


