import { useLocation, Link, useLocation as useLocationHook } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useEffect } from "react";
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
  LogOut,
  Store,
  Wrench,
  Building2,
  MessageCircle,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/Logo";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: Palette,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Manufacturing",
    url: "/manufacturing",
    icon: Wrench,
  },
  {
    title: "Manufacturers",
    url: "/manufacturers",
    icon: Building2,
  },
  {
    title: "Discounts",
    url: "/discounts",
    icon: Tag,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Support",
    url: "/support",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    url: "/settings",
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
      // Clear admin tokens (separate from customer tokens)
      localStorage.removeItem("adminAccessToken");
      localStorage.removeItem("adminRefreshToken");
      localStorage.removeItem("adminUser");
      
      setLocation("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/admin-login");
    }
  };

  return (
    <Sidebar data-testid="admin-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Logo height={30} width={110} />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate text-xs text-muted-foreground">Admin Portal</span>
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
  const [, setLocation] = useLocationHook();

  // Redirect to admin login if not authenticated (using useEffect to avoid React errors)
  useEffect(() => {
    if (!isLoading && (!isAdmin || !adminUser)) {
      setLocation("/admin-login");
    }
  }, [isLoading, isAdmin, adminUser, setLocation]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAdmin || !adminUser) {
    return null; // Will redirect via useEffect
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/'}
              data-testid="button-customer-portal"
              className="shrink-0"
            >
              <Store className="h-4 w-4 mr-2" />
              Customer Portal
            </Button>
          </header>
          <div className="flex-1 overflow-auto p-4 lg:p-6" data-testid="admin-content">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}