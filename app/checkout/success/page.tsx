"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";

function SuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const orderId = searchParams.get("oid");

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Thank you for your purchase!</h1>
      {orderId && <p className="text-muted-foreground mb-6">Order ID: {orderId}</p>}
      <div className="space-x-3">
        <Button onClick={() => router.push("/orders")} variant="secondary">View orders</Button>
        <Button onClick={() => router.push("/")}>Continue shopping</Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16" />}> 
      <SuccessInner />
    </Suspense>
  );
}


