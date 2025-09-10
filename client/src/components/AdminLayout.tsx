import { useLocation, Link, useLocation as useLocationHook } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Tag, 
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Discounts",
    url: "/admin/discounts",
    icon: Tag,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminSidebar() {
  const [location] = useLocation();
  const { adminUser } = useAdminAuth();

  const [, setLocation] = useLocationHook();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/");
    }
  };

  return (
    <Sidebar data-testid="admin-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Teak Theory Admin</span>
            <span className="truncate text-xs text-muted-foreground">
              {adminUser?.email}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url || (item.url !== "/admin" && location.startsWith(item.url))}
                    data-testid={`admin-nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4">
        <Separator className="mb-4" />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="w-full justify-start"
          data-testid="admin-logout-button"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </Sidebar>
  );
}

function LoadingState() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading admin panel...</p>
      </div>
    </div>
  );
}

function UnauthorizedState() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This area is restricted to administrators only. If you believe you should have access, please contact your system administrator.
          </p>
          <Button asChild data-testid="button-return-home">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { adminUser, isLoading, isAdmin } = useAdminAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAdmin || !adminUser) {
    return <UnauthorizedState />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger data-testid="sidebar-toggle" />
            <div className="flex-1">
              <h1 className="font-semibold text-lg">Admin Panel</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 lg:p-6" data-testid="admin-content">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}