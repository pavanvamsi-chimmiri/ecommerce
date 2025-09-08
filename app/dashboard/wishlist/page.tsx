"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Eye } from "lucide-react";
import { toast } from "@/lib/toast";
import { useCartStore } from "@/lib/stores/cart-store";
import Image from "next/image";
import Link from "next/link";

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    images: Array<{
      url: string;
      alt?: string;
    }>;
    inventory?: {
      quantity: number;
    };
  };
  addedAt: string;
}

export default function WishlistPage() {
  const { data: session } = useSession();
  const { addItem } = useCartStore();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setWishlistItems([
      {
        id: "1",
        productId: "prod-1",
        product: {
          id: "prod-1",
          title: "Wireless Bluetooth Headphones",
          slug: "wireless-bluetooth-headphones",
          price: 99.99,
          images: [
            { url: "/images/p11-1.jpg", alt: "Wireless Headphones" }
          ],
          inventory: { quantity: 15 }
        },
        addedAt: "2024-01-15T10:30:00Z"
      },
      {
        id: "2",
        productId: "prod-2",
        product: {
          id: "prod-2",
          title: "Smart Fitness Watch",
          slug: "smart-fitness-watch",
          price: 199.99,
          images: [
            { url: "/images/p12-1.jpg", alt: "Smart Watch" }
          ],
          inventory: { quantity: 8 }
        },
        addedAt: "2024-01-10T14:20:00Z"
      },
      {
        id: "3",
        productId: "prod-3",
        product: {
          id: "prod-3",
          title: "Portable Phone Charger",
          slug: "portable-phone-charger",
          price: 29.99,
          images: [
            { url: "/images/p21-1.jpg", alt: "Phone Charger" }
          ],
          inventory: { quantity: 0 }
        },
        addedAt: "2024-01-05T09:15:00Z"
      },
    ]);
  }, []);

  const handleAddToCart = async (item: WishlistItem) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addItem({
        id: item.product.id,
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.images[0]?.url,
        slug: item.product.slug,
      });
      
      toast({
        title: "Added to cart",
        description: `${item.product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    if (confirm("Remove this item from your wishlist?")) {
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Removed from wishlist",
        description: "The item has been removed from your wishlist.",
      });
    }
  };

  const isOutOfStock = (item: WishlistItem) => {
    return !item.product.inventory || item.product.inventory.quantity === 0;
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-600 mt-2">
          Save items you love for later
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding items you love to your wishlist while browsing.
            </p>
            <Link href="/products">
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Wishlist Stats */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""} in your wishlist
            </p>
            <Button variant="outline" size="sm">
              Share Wishlist
            </Button>
          </div>

          {/* Wishlist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.images[0].alt || item.product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    
                    {/* Out of Stock Overlay */}
                    {isOutOfStock(item) && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => handleRemoveFromWishlist(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-lg line-clamp-2">
                          {item.product.title}
                        </h3>
                        <p className="text-2xl font-bold text-primary">
                          ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/products/${item.product.slug}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        
                        <Button
                          className="flex-1"
                          disabled={isOutOfStock(item) || isLoading}
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {isOutOfStock(item) ? "Out of Stock" : "Add to Cart"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {/* Bulk Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your entire wishlist at once
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    Add All to Cart
                  </Button>
                  <Button variant="outline">
                    Clear Wishlist
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

