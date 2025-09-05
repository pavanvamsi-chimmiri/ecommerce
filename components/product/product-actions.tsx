"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/stores/cart-store";
import { ShoppingCart, CreditCard } from "lucide-react";
import { showToast } from "@/lib/toast";

interface ProductActionsProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    image?: string;
    inventory?: { quantity: number } | null;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });
    
    // Open cart sidebar to show the added item
    openCart();
    showToast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart`,
    });
  };

  const handleBuyNow = () => {
    // Add to cart first
    addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });
    
    // Redirect to checkout (we'll implement this later)
    // For now, just open the cart
    openCart();
    showToast({
      title: "Added to cart",
      description: `${product.title} has been added to your cart`,
    });
  };

  const isOutOfStock = !product.inventory || product.inventory.quantity === 0;
  const maxQuantity = product.inventory?.quantity || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="qty" className="text-sm text-muted-foreground">
            Qty
          </label>
          <Input
            id="qty"
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
            className="w-20"
            disabled={isOutOfStock}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-1"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Buy Now
        </Button>
      </div>

      {isOutOfStock && (
        <p className="text-sm text-destructive">
          This product is currently out of stock
        </p>
      )}

      {product.inventory && product.inventory.quantity > 0 && product.inventory.quantity <= 5 && (
        <p className="text-sm text-orange-600">
          Only {product.inventory.quantity} left in stock!
        </p>
      )}
    </div>
  );
}
