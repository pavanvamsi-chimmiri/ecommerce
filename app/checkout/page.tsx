"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/stores/cart-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShippingFormState {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  const removeItem = useCartStore((s) => s.removeItem);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingFormState>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    phone: "",
  });

  const totalItems = useMemo(() => getTotalItems(), [getTotalItems]);
  const totalPrice = useMemo(() => getTotalPrice(), [getTotalPrice]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/checkout");
    }
  }, [status, router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping: form,
          items,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout/cancel`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // If some items are missing in DB, prune them from cart automatically
        if (data?.error && data.error.includes("not found") && Array.isArray(data?.missing)) {
          const missing: string[] = data.missing;
          // Try to remove by productId or slug
          for (const miss of missing) {
            const match = items.find((it) => it.productId === miss || it.slug === miss || it.title === miss);
            if (match) removeItem(match.productId);
          }
          setError("Some unavailable items were removed. Please try again.");
          return;
        }
        throw new Error(data?.error || "Failed to start checkout");
      }
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Invalid checkout response");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Your cart is empty</h1>
        <Button onClick={() => router.push("/products")}>Browse products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" value={form.name} onChange={onChange} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={onChange} />
                </div>
              </div>
              <div>
                <Label htmlFor="line1">Address line 1</Label>
                <Input id="line1" name="line1" value={form.line1} onChange={onChange} required />
              </div>
              <div>
                <Label htmlFor="line2">Address line 2</Label>
                <Input id="line2" name="line2" value={form.line2} onChange={onChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={form.city} onChange={onChange} required />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={form.state} onChange={onChange} />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" name="postalCode" value={form.postalCode} onChange={onChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" value={form.country} onChange={onChange} required />
              </div>
              {error && (
                <p className="text-red-600 text-sm" role="alert">{error}</p>
              )}
              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting ? "Redirecting..." : "Proceed to payment"}
              </Button>
            </form>
          </Card>
        </div>
        <div>
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Order summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-sm">
                  <span>{item.title} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex items-center justify-between font-medium">
              <span>Total ({totalItems} items)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


