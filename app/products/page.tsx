import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { Filters } from "@/components/catalog/filters";
import { prisma } from "@/lib/prisma";

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
  const min = parseOptionalNumber(get("min"));
  const max = parseOptionalNumber(get("max"));
  const sort = (get("sort") ?? "newest").trim();
  const stock = get("stock") === "1";

  const where: import("@prisma/client").Prisma.ProductWhereInput = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (categorySlug) where.category = { is: { slug: categorySlug } };
  if (typeof min === "number" || typeof max === "number") {
    const priceFilter: import("@prisma/client").Prisma.DecimalFilter = {};
    if (typeof min === "number") priceFilter.gte = min;
    if (typeof max === "number") priceFilter.lte = max;
    where.price = priceFilter;
  }
  if (stock) where.inventory = { is: { quantity: { gt: 0 } } };

  let orderBy: import("@prisma/client").Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  else if (sort === "price-desc") orderBy = { price: "desc" };

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const products = await prisma.product.findMany({
    where,
    include: { images: true, inventory: true },
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  // Load categories from DB for sidebar
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });

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
          {categories.map((c) => (
            <li key={c.id}>
              <Link 
                href={`/products?${new URLSearchParams({ q, category: c.slug, page: "1" }).toString()}`}
                className={categorySlug === c.slug ? "text-primary" : ""}
              >
                {c.name}
              </Link>
            </li>
          ))}
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
                  price: Number(p.price),
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