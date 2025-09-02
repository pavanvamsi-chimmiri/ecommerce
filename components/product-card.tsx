import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { Decimal } from "@prisma/client/runtime/library";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: Decimal;
    images: { url: string; alt: string | null }[];
    inventory?: { quantity: number } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const isInStock = (product.inventory?.quantity ?? 0) > 0;
  const mainImage = product.images[0]?.url || "/placeholder.png";
  const price = Number(product.price);

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={mainImage}
            alt={product.images[0]?.alt || product.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          
          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 hover:bg-white">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock Badge */}
          {!isInStock && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out of Stock
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">
            ${price.toFixed(2)}
          </span>
          
          <Button 
            size="sm" 
            disabled={!isInStock}
            className="h-8 px-3"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
