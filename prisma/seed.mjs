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
    { name: "Electronics", slug: "electronics" },
    { name: "Fashion", slug: "fashion" },
    { name: "Home", slug: "home" },
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

  // Remove deprecated products (cleanup)
  await prisma.product.deleteMany({ where: { slug: { in: [
    "wireless-headphones",
    "smart-watch",
  ] } } });
  // Optionally remove the electronics category if empty
  await prisma.category.deleteMany({ where: { slug: "electronics", products: { none: {} } } });

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
    // (Electronics removed)
    // Fashion (generic fashion items)
    {
      title: "Summer Dress",
      slug: "summer-dress",
      description: "Lightweight summer dress for everyday wear.",
      price: 39.99,
      categorySlug: "fashion",
      images: [
        { url: "/images/p21-1.jpg", alt: "Summer Dress front" },
        { url: "/images/p21-2.jpg", alt: "Summer Dress back" },
      ],
      quantity: 75,
    },
    {
      title: "Leather Belt",
      slug: "leather-belt",
      description: "Genuine leather belt with classic buckle.",
      price: 24.99,
      categorySlug: "fashion",
      images: [
        { url: "/images/p22-1.jpg", alt: "Leather Belt front" },
        { url: "/images/p22-2.jpg", alt: "Leather Belt detail" },
      ],
      quantity: 120,
    },
    // Home (home essentials)
    {
      title: "Cotton Bedsheet",
      slug: "cotton-bedsheet",
      description: "Queen size soft cotton bedsheet.",
      price: 34.99,
      categorySlug: "home",
      images: [
        { url: "/images/p31-1.jpg", alt: "Cotton Bedsheet folded" },
        { url: "/images/p31-2.jpg", alt: "Cotton Bedsheet texture" },
      ],
      quantity: 90,
    },
    {
      title: "Ceramic Vase",
      slug: "ceramic-vase",
      description: "Minimal ceramic vase for decor.",
      price: 19.99,
      categorySlug: "home",
      images: [
        { url: "/images/p32-1.jpg", alt: "Ceramic Vase front" },
        { url: "/images/p32-2.jpg", alt: "Ceramic Vase detail" },
      ],
      quantity: 110,
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

  // Ensure every product has at least 100 units available
  await prisma.inventory.updateMany({
    where: { quantity: { lt: 100 } },
    data: { quantity: 100 },
  });

  console.log("Seeded: categories, products, users. Ensured inventory >= 100 per product");
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


