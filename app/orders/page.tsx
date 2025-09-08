import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Orders</h1>
        <p className="text-muted-foreground">Please sign in to view your orders.</p>
      </div>
    );
  }

  // Resolve DB user by email to ensure we use the persistent database user id
  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email as string } });

  if (!dbUser) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Orders</h1>
        <p className="text-muted-foreground">No account found for {session.user.email}.</p>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: dbUser.id },
    include: { items: { include: { product: { select: { title: true } } } }, payment: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      <div className="space-y-4">
        {orders.length === 0 && (
          <Card className="p-6">
            <p className="text-muted-foreground">You have no orders yet.</p>
          </Card>
        )}
        {orders.map((o) => (
          <Card key={o.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-medium">{o.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{o.status}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {o.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <span>
                    {it.product.title} × {it.quantity}
                  </span>
                  <span>${Number(it.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 flex items-center justify-between font-medium">
              <span>Total</span>
              <span>${Number(o.total).toFixed(2)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}



