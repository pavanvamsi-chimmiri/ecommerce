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

    // Validate incoming items
    const incomingItems = Array.isArray(items) ? items : [];
    if (incomingItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate and secure pricing using DB values
    const requestedItems = (incomingItems as Array<{
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
    const byTitles = requestedItems
      .filter((i) => !i.productId && !i.slug && i.title)
      .map((i) => String(i.title)) as string[];

    const orConditions: Prisma.ProductWhereInput[] = [];
    if (byIds.length) orConditions.push({ id: { in: byIds } });
    if (bySlugs.length) orConditions.push({ slug: { in: bySlugs } });
    if (byTitles.length) {
      // Build case-insensitive OR for each title
      for (const t of byTitles) {
        orConditions.push({ title: { equals: t, mode: "insensitive" } });
      }
    }

    const products = await prisma.product.findMany({
      where: orConditions.length ? { OR: orConditions } : undefined,
      select: { id: true, slug: true, title: true, price: true },
    });
    const productMapById = new Map(products.map((p) => [p.id, p]));
    const productMapBySlug = new Map(products.map((p) => [p.slug, p]));
    const productMapByTitleLower = new Map(products.map((p) => [p.title.toLowerCase(), p]));

    const missing: string[] = [];
    for (const it of requestedItems) {
      const byId = it.productId ? productMapById.get(it.productId) : undefined;
      const bySlug = it.slug ? productMapBySlug.get(it.slug) : undefined;
      const byTitle = it.title ? productMapByTitleLower.get(String(it.title).toLowerCase()) : undefined;
      const found = byId || bySlug || byTitle;
      if (!found) missing.push(it.productId || it.slug || it.title || "unknown");
    }
    // Filter out any missing items instead of failing entirely
    const resolvedItems = requestedItems.filter((i) => {
      const byId = i.productId ? productMapById.get(i.productId) : undefined;
      const bySlug = i.slug ? productMapBySlug.get(i.slug) : undefined;
      const byTitle = i.title ? productMapByTitleLower.get(String(i.title).toLowerCase()) : undefined;
      return !!(byId || bySlug || byTitle);
    });
    if (resolvedItems.length === 0) {
      return NextResponse.json({ error: "Some products not found in database", missing }, { status: 400 });
    }

    // Re-resolve product data strictly for the resolved items to avoid undefined lookups
    const resolvedIds = resolvedItems.filter((i) => i.productId).map((i) => i.productId!) as string[];
    const resolvedSlugs = resolvedItems.filter((i) => !i.productId && i.slug).map((i) => i.slug!) as string[];
    const resolvedProducts = await prisma.product.findMany({
      where: {
        OR: [
          ...(resolvedIds.length ? [{ id: { in: resolvedIds } }] : []),
          ...(resolvedSlugs.length ? [{ slug: { in: resolvedSlugs } }] : []),
          // include exact case-insensitive title matches for titles we received
          ...requestedItems
            .filter((i) => i.title)
            .map((i) => ({ title: { equals: String(i.title), mode: "insensitive" } as Prisma.StringFilter })),
        ],
      },
      select: { id: true, slug: true, title: true, price: true },
    });
    const resolvedMapById = new Map(resolvedProducts.map((p) => [p.id, p]));
    const resolvedMapBySlug = new Map(resolvedProducts.map((p) => [p.slug, p]));
    const resolvedMapByTitleLower = new Map(resolvedProducts.map((p) => [p.title.toLowerCase(), p]));

    const totalAmount = resolvedItems.reduce((sum: number, i) => {
      const byId = i.productId ? resolvedMapById.get(i.productId) : undefined;
      const bySlug = i.slug ? resolvedMapBySlug.get(i.slug) : undefined;
      const byTitle = i.title ? resolvedMapByTitleLower.get(String(i.title).toLowerCase()) : undefined;
      const p = (byId ?? bySlug ?? byTitle)!;
      // Special case: make "Graphic black Tee" free
      const isGraphicBlackTee = p.title?.toLowerCase().includes("graphic black tee");
      const price = isGraphicBlackTee ? 0 : Number(p.price);
      const qty = Math.max(1, i.quantity);
      return sum + price * qty;
    }, 0);

    // Resolve DB user by email (credentials provider uses in-memory ids)
    const dbUser = await prisma.user.upsert({
      where: { email: session.user.email as string },
      update: {},
      create: { email: session.user.email as string, name: session.user.name ?? null },
    });

    // Create or reuse an existing identical address for the user (case-insensitive match)
    const normalized = {
      name: (shipping?.name || "").trim(),
      line1: (shipping?.line1 || "").trim(),
      line2: (shipping?.line2 || "").trim(),
      city: (shipping?.city || "").trim(),
      state: (shipping?.state || "").trim(),
      postalCode: (shipping?.postalCode || "").trim(),
      country: (shipping?.country || "US").trim(),
      phone: (shipping?.phone || "").replace(/\D+/g, ""),
    };
    let address = await prisma.address.findFirst({
      where: {
        userId: dbUser.id,
        name: { equals: normalized.name, mode: "insensitive" },
        line1: { equals: normalized.line1, mode: "insensitive" },
        line2: normalized.line2 ? { equals: normalized.line2, mode: "insensitive" } : undefined,
        city: { equals: normalized.city, mode: "insensitive" },
        state: normalized.state ? { equals: normalized.state, mode: "insensitive" } : undefined,
        postalCode: { equals: normalized.postalCode, mode: "insensitive" },
        country: { equals: normalized.country, mode: "insensitive" },
        phone: normalized.phone ? normalized.phone : undefined,
      },
    });
    if (!address) {
      address = await prisma.address.create({
        data: {
          userId: dbUser.id,
          name: normalized.name,
          line1: normalized.line1,
          line2: normalized.line2 || null,
          city: normalized.city,
          state: normalized.state || null,
          postalCode: normalized.postalCode,
          country: normalized.country,
          phone: normalized.phone || null,
        },
      });
    }

    // Create pending order with items
    const order = await prisma.order.create({
      data: {
        userId: dbUser.id,
        addressId: address.id,
        status: "Pending",
        total: totalAmount,
        items: {
          create: resolvedItems.map((i) => {
            const byId = i.productId ? resolvedMapById.get(i.productId) : undefined;
            const bySlug = i.slug ? resolvedMapBySlug.get(i.slug) : undefined;
            const byTitle = i.title ? resolvedMapByTitleLower.get(String(i.title).toLowerCase()) : undefined;
            const p = (byId ?? bySlug ?? byTitle)!;
            const isGraphicBlackTee = p.title?.toLowerCase().includes("graphic black tee");
            return {
              productId: p.id,
              quantity: i.quantity || 1,
              price: isGraphicBlackTee ? 0 : p.price,
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

    // If total is $0, mark as paid and skip Stripe
    if (totalAmount === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "Paid" },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "succeeded" },
      });
      // Decrement inventory immediately since webhook won't trigger
      const items = await prisma.orderItem.findMany({ where: { orderId: order.id }, select: { productId: true, quantity: true } });
      for (const it of items) {
        await prisma.inventory.updateMany({
          where: { productId: it.productId },
          data: { quantity: { decrement: it.quantity } },
        });
      }
      const success = successUrl || `${APP_URL || "http://localhost:3000"}/checkout/success?oid=${order.id}`;
      return NextResponse.json({ url: success });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = resolvedItems.map((i) => {
      const byId = i.productId ? resolvedMapById.get(i.productId) : undefined;
      const bySlug = i.slug ? resolvedMapBySlug.get(i.slug) : undefined;
      const byTitle = i.title ? resolvedMapByTitleLower.get(String(i.title).toLowerCase()) : undefined;
      const p = (byId ?? bySlug ?? byTitle)!;
      const isGraphicBlackTee = p.title?.toLowerCase().includes("graphic black tee");
      return {
        price_data: {
          currency: "usd",
          // Stripe doesn't allow $0 line items in a paid session, but this branch
          // is only hit when totalAmount > 0, so any $0 item here won't zero the session.
          unit_amount: Math.round(Number(isGraphicBlackTee ? 0 : p.price) * 100),
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


