import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY)
  : (null as unknown as Stripe);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 });
    }

    const body = (await req.json()) as {
      shipping?: {
        name?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
      };
      items?: Array<{
        productId?: string;
        slug?: string;
        title?: string;
        quantity?: number;
        price?: number;
      }>;
      successUrl?: string;
      cancelUrl?: string;
    };
    const { shipping, items, successUrl, cancelUrl } = body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate and secure pricing using DB values
    const requestedItems = (items as Array<{
      productId?: string;
      slug?: string;
      title?: string;
      quantity?: number;
    }>).map((i) => ({
      productId: i.productId ? String(i.productId) : undefined,
      slug: i.slug ? String(i.slug) : undefined,
      title: i.title ? String(i.title) : undefined,
      quantity: Number(i.quantity || 1),
    }));
    const byIds = requestedItems.filter((i) => i.productId).map((i) => i.productId as string);
    const bySlugs = requestedItems.filter((i) => !i.productId && i.slug).map((i) => i.slug as string);
    const orConditions: Prisma.ProductWhereInput[] = [];
    if (byIds.length) orConditions.push({ id: { in: byIds } });
    if (bySlugs.length) orConditions.push({ slug: { in: bySlugs } });
    const products = await prisma.product.findMany({
      where: orConditions.length ? { OR: orConditions } : undefined,
      select: { id: true, slug: true, title: true, price: true },
    });
    const productMapById = new Map(products.map((p) => [p.id, p]));
    const productMapBySlug = new Map(products.map((p) => [p.slug, p]));

    const missing: string[] = [];
    for (const it of requestedItems) {
      const byId = it.productId ? productMapById.get(it.productId) : undefined;
      const bySlug = it.slug ? productMapBySlug.get(it.slug) : undefined;
      const found = byId || bySlug;
      if (!found) missing.push(it.productId || it.slug || it.title || "unknown");
    }
    // Filter out any missing items instead of failing entirely
    const resolvedItems = requestedItems.filter((i) => {
      const byId = i.productId ? productMapById.get(i.productId) : undefined;
      const bySlug = i.slug ? productMapBySlug.get(i.slug) : undefined;
      return !!(byId || bySlug);
    });
    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: "Some products not found in database", missing }, { status: 400 });
    }

    const totalAmount = resolvedItems.reduce((sum: number, i) => {
      const byId = i.productId ? productMapById.get(i.productId) : undefined;
      const p = (byId ?? productMapBySlug.get(i.slug!))!;
      const price = Number(p.price);
      const qty = Math.max(1, i.quantity);
      return sum + price * qty;
    }, 0);

    // Resolve DB user by email (credentials provider uses in-memory ids)
    const dbUser = await prisma.user.upsert({
      where: { email: session.user.email as string },
      update: {},
      create: { email: session.user.email as string, name: session.user.name ?? null },
    });

    // Create address for the user for convenience
    const address = await prisma.address.create({
      data: {
        userId: dbUser.id,
        name: shipping?.name || "",
        line1: shipping?.line1 || "",
        line2: shipping?.line2 || null,
        city: shipping?.city || "",
        state: shipping?.state || null,
        postalCode: shipping?.postalCode || "",
        country: shipping?.country || "US",
        phone: shipping?.phone || null,
      },
    });

    // Create pending order with items
    const order = await prisma.order.create({
      data: {
        userId: dbUser.id,
        addressId: address.id,
        status: "Pending",
        total: totalAmount,
        items: {
          create: resolvedItems.map((i) => {
            const byId = i.productId ? productMapById.get(i.productId) : undefined;
            const p = (byId ?? productMapBySlug.get(i.slug!))!;
            return {
              productId: p.id,
              quantity: i.quantity || 1,
              price: p.price,
            };
          }),
        },
      },
      include: { items: true },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        currency: "usd",
        status: "pending",
      },
    });

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = resolvedItems.map((i) => {
      const byId = i.productId ? productMapById.get(i.productId) : undefined;
      const p = (byId ?? productMapBySlug.get(i.slug!))!;
      return {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(p.price) * 100),
          product_data: { name: p.title },
        },
        quantity: i.quantity || 1,
      };
    });

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: "No valid items to checkout" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      // payment_method_types is optional in newer Stripe versions
      line_items,
      success_url: successUrl || `${APP_URL || "http://localhost:3000"}/checkout/success?oid=${order.id}`,
      cancel_url: cancelUrl || `${APP_URL || "http://localhost:3000"}/checkout/cancel?oid=${order.id}`,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        userId: dbUser.id,
      },
    });

    // Save provider reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("checkout error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


