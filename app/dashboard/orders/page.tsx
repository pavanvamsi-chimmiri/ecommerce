import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, MapPin, CreditCard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function OrdersPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Loading...</div>;
  }

  // Get all orders for the user
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      },
      address: true
    },
    orderBy: { createdAt: "desc" }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "processing":
        return "outline";
      case "shipped":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600 mt-2">
          Track and manage your orders
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(-8)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        ${order.total.toString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-3">Items Ordered</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                            {item.product.images[0] ? (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{item.product.title}</h5>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ${item.price.toString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.address && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="font-medium">{order.address.name}</p>
                        <p>{order.address.line1}</p>
                        {order.address.line2 && <p>{order.address.line2}</p>}
                        <p>
                          {order.address.city}, {order.address.state} {order.address.postalCode}
                        </p>
                        <p>{order.address.country}</p>
                        {order.address.phone && <p>Phone: {order.address.phone}</p>}
                      </div>
                    </div>
                  )}

                  {/* Order Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Order placed on {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Track Order
                      </Button>
                      <Button variant="outline" size="sm">
                        Reorder
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
