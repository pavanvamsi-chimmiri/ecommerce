import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Filters } from "@/components/catalog/filters";

type SearchParams = Record<string, string | string[] | undefined>;

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

const PAGE_SIZE = 12;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params: SearchParams = await searchParams;

  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const parseOptionalNumber = (value: string | undefined) =>
    value !== undefined && value !== "" ? Number(value) : undefined;

  const page = Math.max(1, Number(get("page") ?? 1));
  const q = (get("q") ?? "").trim();
  const categorySlug = (get("category") ?? "").trim();
  if (categorySlug === "electronics") notFound();
  if (categorySlug === "home") redirect("/");
  const min = parseOptionalNumber(get("min"));
  const max = parseOptionalNumber(get("max"));
  const sort = (get("sort") ?? "newest").trim();
  const stock = get("stock") === "1";

  const where: {
    active: boolean;
    OR?: Array<{ title: { contains: string; mode: "insensitive" } } | { description: { contains: string; mode: "insensitive" } }>;
    category?: { is: { slug: string } };
    price?: { gte?: number; lte?: number };
    inventory?: { quantity: { gt: number } };
  } = { active: true };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categorySlug) {
    where.category = { is: { slug: categorySlug } };
  }
  if (typeof min === "number") {
    where.price = { ...(where.price ?? {}), gte: min };
  }
  if (typeof max === "number") {
    where.price = { ...(where.price ?? {}), lte: max };
  }
  if (stock) {
    where.inventory = { quantity: { gt: 0 } };
  }

  const [total, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        inventory: true,
      },
      orderBy:
        sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.category.findMany({
      where: { slug: { not: "electronics" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <h2 className="font-semibold mb-3">Categories</h2>
        <ul className="space-y-2">
          <li>
            <Link href={{ pathname: "/products", query: { q, page: 1 } }} className={!categorySlug ? "text-primary" : ""}>
              All
            </Link>
          </li>
          {categories.map((c) => {
            const isHome = c.slug === "home";
            const href = isHome
              ? "/"
              : `/products?${new URLSearchParams({ q, category: c.slug, page: "1" }).toString()}`;
            return (
              <li key={c.id}>
                <Link href={href} className={categorySlug === c.slug ? "text-primary" : ""}>
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <Filters minPrice={0} maxPrice={500} />
        </div>
      </aside>

      <main className="md:col-span-3">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <span className="text-sm text-muted-foreground">{total} items</span>
        </div>

        {products.length === 0 ? (
          <p className="text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  title: p.title,
                  slug: p.slug,
                  price: p.price,
                  images: p.images.map((img) => ({ url: img.url, alt: img.alt ?? null })),
                  inventory: p.inventory ? { quantity: p.inventory.quantity } : null,
                }}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pnum) => (
              <Link
                key={pnum}
                href={{ pathname: "/products", query: { q, category: categorySlug || undefined, page: pnum } }}
                className={`px-3 py-1 rounded ${pnum === page ? "bg-primary text-primary-foreground" : "border"}`}
              >
                {pnum}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


