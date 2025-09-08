import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
