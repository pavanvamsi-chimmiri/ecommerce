import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel } from "@/components/ui/carousel";
import { ProductCard } from "@/components/product-card";
import { Decimal } from "@prisma/client/runtime/library";
import Link from "next/link";

// Mock data for latest products
const mockProducts = [
  {
    id: "1",
    title: "Classic White Tee",
    slug: "classic-white-tee",
    price: new Decimal(19.99),
    images: [{ url: "/images/p11-1.jpg", alt: "Classic White Tee front" }],
    inventory: { quantity: 100 },
  },
  {
    id: "2",
    title: "Graphic Black Tee",
    slug: "graphic-black-tee",
    price: new Decimal(24.99),
    images: [{ url: "/images/p12-1.jpg", alt: "Graphic Black Tee front" }],
    inventory: { quantity: 80 },
  },
  {
    id: "3",
    title: "Slim Fit Jeans",
    slug: "slim-fit-jeans",
    price: new Decimal(49.99),
    images: [{ url: "/images/p21-1.jpg", alt: "Slim Fit Jeans front" }],
    inventory: { quantity: 60 },
  },
  {
    id: "4",
    title: "Relaxed Fit Jeans",
    slug: "relaxed-fit-jeans",
    price: new Decimal(44.99),
    images: [{ url: "/images/p22-1.jpg", alt: "Relaxed Fit Jeans front" }],
    inventory: { quantity: 70 },
  },
  {
    id: "5",
    title: "Everyday Sneakers",
    slug: "everyday-sneakers",
    price: new Decimal(59.99),
    images: [{ url: "/images/p31-1.jpg", alt: "Everyday Sneakers side" }],
    inventory: { quantity: 90 },
  },
  {
    id: "6",
    title: "Running Trainers",
    slug: "running-trainers",
    price: new Decimal(79.99),
    images: [{ url: "/images/p32-1.jpg", alt: "Running Trainers side" }],
    inventory: { quantity: 50 },
  },
];

export default function HomePage() {
  const bannerImages = [
    {
      src: "/images/images/banner1.jpg",
      alt: "Special Offer",
      title: "Special Offer",
      description: "Up to 50% off on selected items",
    },
    {
      src: "/images/images/banner2.jpg",
      alt: "New Collection",
      title: "New Collection",
      description: "Discover our latest arrivals",
    },
    {
      src: "/images/images/banner3.jpg",
      alt: "Free Shipping",
      title: "Free Shipping",
      description: "On orders over $50",
    },
  ];

  return (
    <div className="container py-8">
      {/* Banner Carousel */}
      <section className="mb-12">
        <Carousel images={bannerImages} />
      </section>

      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to <span className="text-primary">EStore</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover amazing products at great prices. Fast shipping and excellent customer service.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/products">
            <Button size="lg">Shop Now</Button>
          </Link>
          <Link href="/categories">
            <Button variant="outline" size="lg">Browse Categories</Button>
          </Link>
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Latest Products</h2>
          <Link href="/products">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fast Shipping</CardTitle>
              <CardDescription>
                Get your orders delivered quickly with our reliable shipping service.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quality Products</CardTitle>
              <CardDescription>
                We only sell high-quality products that meet our strict standards.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>24/7 Support</CardTitle>
              <CardDescription>
                Our customer support team is always here to help you.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 bg-muted/50 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of satisfied customers who trust EStore for their shopping needs.
        </p>
        <Link href="/products">
          <Button size="lg">Explore Products</Button>
        </Link>
      </section>
    </div>
  );
}
