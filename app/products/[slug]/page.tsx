import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/product-card";
import { ProductActions } from "@/components/product/product-actions";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Mock data for products
const mockProducts = [
  {
    id: "1",
    title: "Classic White Tee",
    slug: "classic-white-tee",
    price: 19.99,
    description: "A comfortable and versatile white t-shirt made from 100% cotton. Perfect for everyday wear.",
    images: [
      { url: "/images/p11-1.jpg", alt: "Classic White Tee front" },
      { url: "/images/p11-2.jpg", alt: "Classic White Tee back" }
    ],
    inventory: { quantity: 100 },
    category: { name: "T-Shirts" },
    reviews: [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 }
    ]
  },
  {
    id: "2",
    title: "Graphic Black Tee",
    slug: "graphic-black-tee",
    price: 24.99,
    description: "A stylish black t-shirt with a modern graphic design. Made from premium cotton blend.",
    images: [
      { url: "/images/p12-1.jpg", alt: "Graphic Black Tee front" },
      { url: "/images/p12-2.jpg", alt: "Graphic Black Tee back" }
    ],
    inventory: { quantity: 80 },
    category: { name: "T-Shirts" },
    reviews: [
      { rating: 4 },
      { rating: 5 }
    ]
  },
  {
    id: "3",
    title: "Slim Fit Jeans",
    slug: "slim-fit-jeans",
    price: 49.99,
    description: "Modern slim fit jeans with a comfortable stretch. Perfect for casual and semi-formal occasions.",
    images: [
      { url: "/images/p21-1.jpg", alt: "Slim Fit Jeans front" },
      { url: "/images/p21-2.jpg", alt: "Slim Fit Jeans back" }
    ],
    inventory: { quantity: 60 },
    category: { name: "Jeans" },
    reviews: [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 }
    ]
  },
  {
    id: "4",
    title: "Relaxed Fit Jeans",
    slug: "relaxed-fit-jeans",
    price: 44.99,
    description: "Comfortable relaxed fit jeans with a classic look. Made from durable denim.",
    images: [
      { url: "/images/p22-1.jpg", alt: "Relaxed Fit Jeans front" },
      { url: "/images/p22-2.jpg", alt: "Relaxed Fit Jeans back" }
    ],
    inventory: { quantity: 70 },
    category: { name: "Jeans" },
    reviews: [
      { rating: 4 },
      { rating: 5 }
    ]
  },
  {
    id: "5",
    title: "Everyday Sneakers",
    slug: "everyday-sneakers",
    price: 59.99,
    description: "Comfortable everyday sneakers with excellent cushioning and support. Perfect for daily wear.",
    images: [
      { url: "/images/p31-1.jpg", alt: "Everyday Sneakers side" },
      { url: "/images/p31-2.jpg", alt: "Everyday Sneakers front" }
    ],
    inventory: { quantity: 90 },
    category: { name: "Shoes" },
    reviews: [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 }
    ]
  },
  {
    id: "6",
    title: "Running Trainers",
    slug: "running-trainers",
    price: 79.99,
    description: "High-performance running trainers with advanced cushioning technology. Ideal for athletes.",
    images: [
      { url: "/images/p32-1.jpg", alt: "Running Trainers side" },
      { url: "/images/p32-2.jpg", alt: "Running Trainers front" }
    ],
    inventory: { quantity: 50 },
    category: { name: "Shoes" },
    reviews: [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 }
    ]
  }
];

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = mockProducts.find(p => p.slug === slug);
  
  if (!product) notFound();

  // Find related products (same category, excluding current product)
  const related = mockProducts
    .filter(p => p.category.name === product.category.name && p.id !== product.id)
    .slice(0, 6);

  const mainImage = product.images[0]?.url ?? "/next.svg";
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="container py-8 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden border">
            <Image src={mainImage} alt={product.title} fill className="object-cover" unoptimized />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {product.images.slice(0, 8).map((img, index) => (
                <div key={index} className="relative aspect-square rounded overflow-hidden border">
                  <Image src={img.url} alt={img.alt ?? product.title} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <div className="text-muted-foreground">in {product.category.name}</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold">${Number(product.price).toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">{product.inventory?.quantity ?? 0} in stock</span>
          </div>
          <div className="text-sm text-muted-foreground">Rating: {averageRating.toFixed(1)} / 5 ({product.reviews.length})</div>
          {product.description && <p className="leading-relaxed">{product.description}</p>}

          <div className="flex items-center gap-3 pt-2">
            <ProductActions 
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: Number(product.price),
                image: mainImage,
                inventory: product.inventory,
              }}
            />
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Related products</h2>
        {related.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">No related products.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
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
      </section>
    </div>
  );
}