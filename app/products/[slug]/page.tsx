import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      inventory: true,
      category: true,
      reviews: true,
    },
  });

  if (!product || !product.active) notFound();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, active: true },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, inventory: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const mainImage = product.images[0]?.url ?? "/next.svg";
  const averageRating =
    product.reviews.length > 0
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
              {product.images.slice(0, 8).map((img) => (
                <div key={img.id} className="relative aspect-square rounded overflow-hidden border">
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
            <div className="flex items-center gap-2">
              <label htmlFor="qty" className="text-sm text-muted-foreground">Qty</label>
              <Input id="qty" type="number" min={1} defaultValue={1} className="w-20" />
            </div>
            <Button>Add to cart</Button>
            <Button variant="outline">Buy now</Button>
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
                  price: p.price,
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



