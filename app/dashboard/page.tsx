import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, MapPin, Heart } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return <div>Loading...</div>;
  }

  // Resolve DB user by email and fetch profile info
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { id: true, createdAt: true, name: true, email: true }
  });

  // Get user statistics
  const [orderCount, addressCount, wishlistCount] = await Promise.all([
    prisma.order.count({
      where: { userId: user?.id || "" }
    }),
    prisma.address.count({
      where: { userId: user?.id || "" }
    }),
    prisma.wishlist.count({
      where: { userId: user?.id || "" }
    })
  ]);

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { userId: user?.id || "" },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || user?.email || session.user.email}!
        </h1>
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        <p className="text-gray-600 mt-2">
          Stay up to date with your recent activity, orders, and account details below.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Addresses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{addressCount}</div>
            <p className="text-xs text-muted-foreground">
              Delivery addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wishlistCount}</div>
            <p className="text-xs text-muted-foreground">
              Saved for later
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Badge variant="secondary">Active</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Your latest orders and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-6">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start shopping to see your orders here
                </p>
                <Link href="/products">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                    Browse Products
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Order #{order.id.slice(-8)}</h4>
                        <Badge variant={order.status === "Completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} • ${order.total.toString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <Link href="/dashboard/orders" className="text-primary hover:underline">
                    View all orders
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/products" className="block">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Browse Products</div>
                <div className="text-sm text-muted-foreground">Discover new items</div>
              </button>
            </Link>
            
            <Link href="/dashboard/profile" className="block">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Update Profile</div>
                <div className="text-sm text-muted-foreground">Manage your account info</div>
              </button>
            </Link>
            
            <Link href="/dashboard/addresses" className="block">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Manage Addresses</div>
                <div className="text-sm text-muted-foreground">Add or edit delivery addresses</div>
              </button>
            </Link>
            
            <Link href="/dashboard/wishlist" className="block">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">View Wishlist</div>
                <div className="text-sm text-muted-foreground">See your saved items</div>
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
