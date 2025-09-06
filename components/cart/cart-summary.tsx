"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/lib/stores/cart-store";
import Link from "next/link";

export function CartSummary() {
  const { getTotalItems, getTotalPrice, clearCart, closeCart } = useCartStore();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="font-medium text-lg mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">
            Add some products to get started
          </p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Order Summary</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-muted-foreground hover:text-destructive"
          >
            Clear Cart
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Items ({totalItems})</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${(totalPrice * 0.08).toFixed(2)}</span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${(totalPrice * 1.08).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Link href="/checkout" className="block" onClick={(e) => {
            e.preventDefault();
            closeCart();
            setTimeout(() => {
              window.location.href = '/checkout';
            }, 100);
          }}>
            <Button className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
          
          <Link href="/products" className="block" onClick={(e) => {
            e.preventDefault();
            closeCart();
            setTimeout(() => {
              window.location.href = '/products';
            }, 100);
          }}>
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
