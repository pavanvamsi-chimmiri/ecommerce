import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Defer Stripe initialization to request time to avoid build-time failures

function buffer(req: Request): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await req.arrayBuffer();
      resolve(Buffer.from(arrayBuffer));
    } catch (e) {
      reject(e);
    }
  });
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
  if (!secretKey) {
    return NextResponse.json({ error: "Missing Stripe secret key" }, { status: 500 });
  }
  const stripe = new Stripe(secretKey);
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });

  let event: Stripe.Event;
  try {
    const buf = await buffer(req as unknown as Request);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId || "";
        const paymentStatus = session.payment_status;
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: paymentStatus === "paid" ? "Paid" : "Pending" },
          });
          await prisma.payment.updateMany({
            where: { orderId },
            data: { status: paymentStatus === "paid" ? "succeeded" : "pending" },
          });

          if (paymentStatus === "paid") {
            // Decrement inventory for each item in the order
            const items = await prisma.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });
            for (const it of items) {
              await prisma.inventory.updateMany({
                where: { productId: it.productId },
                data: { quantity: { decrement: it.quantity } },
              });
            }
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId || "";
        if (orderId) {
          await prisma.order.update({ where: { id: orderId }, data: { status: "Expired" } });
          await prisma.payment.updateMany({ where: { orderId }, data: { status: "expired" } });
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


