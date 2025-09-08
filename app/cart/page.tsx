"use client";

import { useCartStore } from "@/lib/stores/cart-store";
import { CartItemComponent } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const totalItems = getTotalItems();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-pulse">
            <div className="h-24 w-24 mx-auto bg-gray-200 rounded mb-6"></div>
            <div className="h-8 w-64 mx-auto bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-96 mx-auto bg-gray-200 rounded mb-8"></div>
            <div className="h-10 w-32 mx-auto bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Looks like you haven&apos;t added any items to your cart yet. 
            Start shopping to fill it up!
          </p>
          <Link href="/products">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemComponent key={item.productId} item={item} />
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartSummary />
            </div>
          </div>
        </div>
      )}
      <p className="text-muted-foreground mb-6">
        You have not placed any orders yet. Start shopping to see your order history here.
      </p>
      <p className="text-gray-600 mt-2">
        Stay up to date with your recent activity, orders, and account details below.
      </p>
    </div>
  );
}