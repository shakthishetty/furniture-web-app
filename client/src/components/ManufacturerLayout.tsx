import { useLocation, Link, useLocation as useLocationHook } from "wouter";
import { useManufacturerAuth } from "@/hooks/useManufacturerAuth";
import { useQuery } from "@tanstack/react-query";
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
  Package, 
  Settings,
  LogOut,
  Store,
  Wrench,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";

const manufacturerMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "My Processes",
    url: "/processes",
    icon: Wrench,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

interface ManufacturerLayoutProps {
  children: React.ReactNode;
}

function ManufacturerSidebar() {
  const [location] = useLocation();
  const { manufacturerUser } = useManufacturerAuth();

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

  const displayName = manufacturerUser?.firstName && manufacturerUser?.lastName 
    ? `${manufacturerUser.firstName} ${manufacturerUser.lastName}` 
    : manufacturerUser?.email || "Manufacturer";

  return (
    <Sidebar data-testid="manufacturer-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Logo height={30} width={110} />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate text-xs text-muted-foreground">Manufacturer Portal</span>
            <span className="truncate text-xs text-muted-foreground">
              {displayName}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manufacturing Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manufacturerMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url || (item.url !== "/manufacturer" && location.startsWith(item.url))}
                    data-testid={`manufacturer-nav-${item.title.toLowerCase().replace(' ', '-')}`}
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
          data-testid="manufacturer-logout-button"
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading manufacturer portal...</p>
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
            You don't have permission to access the manufacturer portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This area is restricted to manufacturers only. If you believe you should have access, please contact your administrator.
          </p>
          <Button asChild data-testid="button-return-home">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ManufacturerLayout({ children }: ManufacturerLayoutProps) {
  const { manufacturerUser, isLoading, isManufacturer } = useManufacturerAuth();
  const [, setLocation] = useLocationHook();

  // Fetch unread notification count
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications', 'unread-count'],
    enabled: !!manufacturerUser,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isManufacturer || !manufacturerUser) {
    return <UnauthorizedState />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ManufacturerSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger data-testid="sidebar-toggle" />
            <div className="flex-1">
              <h1 className="font-semibold text-lg">Manufacturing Portal</h1>
            </div>
            
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              onClick={() => setLocation('/manufacturer/notifications')}
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount.count > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  data-testid="notification-count-badge"
                >
                  {unreadCount.count}
                </Badge>
              )}
            </Button>

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
          <div className="flex-1 overflow-auto p-4 lg:p-6" data-testid="manufacturer-content">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}