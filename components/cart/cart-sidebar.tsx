"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { CartItemComponent } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CartSidebar() {
  const { isOpen, closeCart, items, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  const totalItems = getTotalItems();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={(e) => {
          e.preventDefault();
          closeCart();
        }}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-2xl z-[60] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Shopping Cart</h2>
            {totalItems > 0 && (
              <Badge variant="secondary">{totalItems}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {totalItems === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-4">
                Add some products to get started
              </p>
              <Link href="/products" onClick={(e) => {
                e.preventDefault();
                closeCart();
                setTimeout(() => {
                  window.location.href = '/products';
                }, 100);
              }}>
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemComponent key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && (
          <div className="border-t p-4">
            <CartSummary />
          </div>
        )}
      </div>
    </>
  );
}