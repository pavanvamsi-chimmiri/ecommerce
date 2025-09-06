"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function CancelInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("oid");

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment canceled</h1>
      {orderId && <p className="text-muted-foreground mb-6">Order ID: {orderId}</p>}
      <p className="text-muted-foreground mb-8">You can continue shopping or try checkout again.</p>
      <div className="space-x-3">
        <Button onClick={() => router.push("/checkout")}>Return to checkout</Button>
        <Button onClick={() => router.push("/products")} variant="secondary">Browse products</Button>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16" />}> 
      <CancelInner />
    </Suspense>
  );
}


