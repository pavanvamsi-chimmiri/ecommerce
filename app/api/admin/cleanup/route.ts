import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CleanupAction = "removePendingOrders" | "dedupeAddresses";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { action?: CleanupAction };
    const action = body?.action;

    // 1) Remove all pending orders
    if (!action || action === "removePendingOrders") {
      await prisma.$transaction([
        prisma.payment.deleteMany({ where: { order: { status: "Pending" } } }),
        prisma.order.deleteMany({ where: { status: "Pending" } }),
      ]);
    }

    // 2) Deduplicate addresses per user (case-insensitive match on fields)
    if (!action || action === "dedupeAddresses") {
      const users = await prisma.user.findMany({ select: { id: true } });
      for (const u of users) {
        const addresses = await prisma.address.findMany({
          where: { userId: u.id },
          orderBy: { id: "asc" },
        });
        const seen = new Set<string>();
        const toDeleteIds: string[] = [];
        for (const a of addresses) {
          const key = [
            (a.name || "").trim().toLowerCase(),
            (a.line1 || "").trim().toLowerCase(),
            (a.line2 || "").trim().toLowerCase(),
            (a.city || "").trim().toLowerCase(),
            (a.state || "").trim().toLowerCase(),
            (a.postalCode || "").trim().toLowerCase(),
            (a.country || "").trim().toLowerCase(),
            (a.phone || "").replace(/\D+/g, ""),
          ].join("|");
          if (seen.has(key)) {
            toDeleteIds.push(a.id);
          } else {
            seen.add(key);
          }
        }
        if (toDeleteIds.length) {
          await prisma.address.deleteMany({ where: { id: { in: toDeleteIds } } });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


