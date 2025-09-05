import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { Filters } from "@/components/catalog/filters";

type SearchParams = Record<string, string | string[] | undefined>;

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

const PAGE_SIZE = 12;

// Mock data for products
const mockProducts = [
  {
    id: "1",
    title: "Classic White Tee",
    slug: "classic-white-tee",
    price: 19.99,
    images: [{ url: "/images/p11-1.jpg", alt: "Classic White Tee front" }],
    inventory: { quantity: 100 },
  },
  {
    id: "2",
    title: "Graphic Black Tee",
    slug: "graphic-black-tee",
    price: 24.99,
    images: [{ url: "/images/p12-1.jpg", alt: "Graphic Black Tee front" }],
    inventory: { quantity: 80 },
  },
  {
    id: "3",
    title: "Slim Fit Jeans",
    slug: "slim-fit-jeans",
    price: 49.99,
    images: [{ url: "/images/p21-1.jpg", alt: "Slim Fit Jeans front" }],
    inventory: { quantity: 60 },
  },
  {
    id: "4",
    title: "Relaxed Fit Jeans",
    slug: "relaxed-fit-jeans",
    price: 44.99,
    images: [{ url: "/images/p22-1.jpg", alt: "Relaxed Fit Jeans front" }],
    inventory: { quantity: 70 },
  },
  {
    id: "5",
    title: "Everyday Sneakers",
    slug: "everyday-sneakers",
    price: 59.99,
    images: [{ url: "/images/p31-1.jpg", alt: "Everyday Sneakers side" }],
    inventory: { quantity: 90 },
  },
  {
    id: "6",
    title: "Running Trainers",
    slug: "running-trainers",
    price: 79.99,
    images: [{ url: "/images/p32-1.jpg", alt: "Running Trainers side" }],
    inventory: { quantity: 50 },
  },
  {
    id: "7",
    title: "Premium Hoodie",
    slug: "premium-hoodie",
    price: 69.99,
    images: [{ url: "/images/p11-2.jpg", alt: "Premium Hoodie" }],
    inventory: { quantity: 40 },
  },
  {
    id: "8",
    title: "Casual Shorts",
    slug: "casual-shorts",
    price: 29.99,
    images: [{ url: "/images/p12-2.jpg", alt: "Casual Shorts" }],
    inventory: { quantity: 75 },
  },
  {
    id: "9",
    title: "Formal Dress Shirt",
    slug: "formal-dress-shirt",
    price: 39.99,
    images: [{ url: "/images/p21-2.jpg", alt: "Formal Dress Shirt" }],
    inventory: { quantity: 55 },
  },
  {
    id: "10",
    title: "Athletic Shorts",
    slug: "athletic-shorts",
    price: 34.99,
    images: [{ url: "/images/p22-2.jpg", alt: "Athletic Shorts" }],
    inventory: { quantity: 65 },
  },
  {
    id: "11",
    title: "Canvas Shoes",
    slug: "canvas-shoes",
    price: 54.99,
    images: [{ url: "/images/p31-2.jpg", alt: "Canvas Shoes" }],
    inventory: { quantity: 85 },
  },
  {
    id: "12",
    title: "Leather Boots",
    slug: "leather-boots",
    price: 89.99,
    images: [{ url: "/images/p32-2.jpg", alt: "Leather Boots" }],
    inventory: { quantity: 30 },
  },
];

const mockCategories = [
  { id: "1", name: "T-Shirts", slug: "t-shirts" },
  { id: "2", name: "Jeans", slug: "jeans" },
  { id: "3", name: "Shoes", slug: "shoes" },
  { id: "4", name: "Accessories", slug: "accessories" },
];

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

  // Filter products based on search parameters
  let filteredProducts = [...mockProducts];

  // Search filter
  if (q) {
    filteredProducts = filteredProducts.filter(product =>
      product.title.toLowerCase().includes(q.toLowerCase())
    );
  }

  // Category filter
  if (categorySlug) {
    filteredProducts = filteredProducts.filter(product => {
      // Simple category mapping based on product titles
      if (categorySlug === "t-shirts" && product.title.toLowerCase().includes("tee")) return true;
      if (categorySlug === "jeans" && product.title.toLowerCase().includes("jeans")) return true;
      if (categorySlug === "shoes" && (product.title.toLowerCase().includes("sneakers") || product.title.toLowerCase().includes("trainers") || product.title.toLowerCase().includes("shoes") || product.title.toLowerCase().includes("boots"))) return true;
      return false;
    });
  }

  // Price filter
  if (typeof min === "number") {
    filteredProducts = filteredProducts.filter(product => Number(product.price) >= min);
  }
  if (typeof max === "number") {
    filteredProducts = filteredProducts.filter(product => Number(product.price) <= max);
  }

  // Stock filter
  if (stock) {
    filteredProducts = filteredProducts.filter(product => product.inventory.quantity > 0);
  }

  // Sort products
  if (sort === "price-asc") {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price-desc") {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  } else {
    // Default: newest (keep original order)
  }

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
          {mockCategories.map((c) => (
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

        {paginatedProducts.length === 0 ? (
          <p className="text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProducts.map((p) => (
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