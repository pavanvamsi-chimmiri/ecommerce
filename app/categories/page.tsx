import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CategoriesPage() {
  const categories = [
    { id: "1", name: "T-Shirts", slug: "t-shirts" },
    { id: "2", name: "Jeans", slug: "jeans" },
    { id: "3", name: "Shoes", slug: "shoes" },
    { id: "4", name: "Accessories", slug: "accessories" },
    { id: "5", name: "Hoodies", slug: "hoodies" },
    { id: "6", name: "Shorts", slug: "shorts" },
    { id: "7", name: "Dress Shirts", slug: "dress-shirts" },
    { id: "8", name: "Athletic Wear", slug: "athletic-wear" },
  ];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>
      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => {
            const href = `/products?category=${encodeURIComponent(c.slug)}&page=1`;
            return (
              <Link key={c.id} href={href}>
                <Card className="hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle>{c.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}