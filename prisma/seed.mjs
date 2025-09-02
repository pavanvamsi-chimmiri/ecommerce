import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed users
  const adminEmail = "admin@example.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, name: "Admin", role: "ADMIN" },
  });

  const customerEmails = [
    { email: "alice@example.com", name: "Alice" },
    { email: "bob@example.com", name: "Bob" },
  ];

  for (const u of customerEmails) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, role: "CUSTOMER" },
    });
  }

  // Seed categories
  const categories = [
    { name: "T-shirts", slug: "t-shirts" },
    { name: "Jeans", slug: "jeans" },
    { name: "Shoes", slug: "shoes" },
  ];

  const categoryMap = {};
  for (const c of categories) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    categoryMap[c.slug] = created.id;
  }

  // Products per category (2 each) using images in public/images
  const products = [
    // T-shirts
    {
      title: "Classic White Tee",
      slug: "classic-white-tee",
      description: "Soft cotton crew neck t-shirt in white.",
      price: 19.99,
      categorySlug: "t-shirts",
      images: [
        { url: "/images/p11-1.jpg", alt: "Classic White Tee front" },
        { url: "/images/p11-2.jpg", alt: "Classic White Tee back" },
      ],
      quantity: 100,
    },
    {
      title: "Graphic Black Tee",
      slug: "graphic-black-tee",
      description: "Black tee with minimal graphic print.",
      price: 24.99,
      categorySlug: "t-shirts",
      images: [
        { url: "/images/p12-1.jpg", alt: "Graphic Black Tee front" },
        { url: "/images/p12-2.jpg", alt: "Graphic Black Tee detail" },
      ],
      quantity: 80,
    },
    // Jeans
    {
      title: "Slim Fit Jeans",
      slug: "slim-fit-jeans",
      description: "Mid-rise slim fit denim in indigo.",
      price: 49.99,
      categorySlug: "jeans",
      images: [
        { url: "/images/p21-1.jpg", alt: "Slim Fit Jeans front" },
        { url: "/images/p21-2.jpg", alt: "Slim Fit Jeans back" },
      ],
      quantity: 60,
    },
    {
      title: "Relaxed Fit Jeans",
      slug: "relaxed-fit-jeans",
      description: "Comfortable relaxed fit denim.",
      price: 44.99,
      categorySlug: "jeans",
      images: [
        { url: "/images/p22-1.jpg", alt: "Relaxed Fit Jeans front" },
        { url: "/images/p22-2.jpg", alt: "Relaxed Fit Jeans back" },
      ],
      quantity: 70,
    },
    // Shoes
    {
      title: "Everyday Sneakers",
      slug: "everyday-sneakers",
      description: "Lightweight sneakers for daily wear.",
      price: 59.99,
      categorySlug: "shoes",
      images: [
        { url: "/images/p31-1.jpg", alt: "Everyday Sneakers side" },
        { url: "/images/p31-2.jpg", alt: "Everyday Sneakers top" },
      ],
      quantity: 90,
    },
    {
      title: "Running Trainers",
      slug: "running-trainers",
      description: "Breathable trainers with cushioned sole.",
      price: 79.99,
      categorySlug: "shoes",
      images: [
        { url: "/images/p32-1.jpg", alt: "Running Trainers side" },
        { url: "/images/p32-2.jpg", alt: "Running Trainers sole" },
      ],
      quantity: 50,
    },
  ];

  for (const p of products) {
    const categoryId = categoryMap[p.categorySlug];
    if (!categoryId) continue;

    // Upsert product and replace images on update
    const existing = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: p.title,
          description: p.description,
          price: p.price,
          categoryId,
          images: {
            deleteMany: {},
            create: p.images.map((img) => ({ url: img.url, alt: img.alt })),
          },
          inventory: {
            upsert: {
              update: { quantity: p.quantity },
              create: { quantity: p.quantity },
            },
          },
        },
      });
    } else {
      await prisma.product.create({
        data: {
          title: p.title,
          slug: p.slug,
          description: p.description,
          price: p.price,
          categoryId,
          images: { create: p.images.map((img) => ({ url: img.url, alt: img.alt })) },
          inventory: { create: { quantity: p.quantity } },
        },
      });
    }
  }

  console.log("Seeded: categories (3), products (6), users (3)");
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


