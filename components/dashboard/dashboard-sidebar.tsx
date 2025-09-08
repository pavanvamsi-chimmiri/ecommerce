"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Package, 
  User, 
  MapPin, 
  Heart,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: Package,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    name: "Addresses",
    href: "/dashboard/addresses",
    icon: MapPin,
  },
  {
    name: "Wishlist",
    href: "/dashboard/wishlist",
    icon: Heart,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary"></div>
            <span className="font-bold text-xl">EStore</span>
          </Link>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700 hover:text-primary hover:bg-gray-50",
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-primary",
                            "h-6 w-6 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            
            <li className="mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-6 w-6 shrink-0 mr-3" />
                Sign Out
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
