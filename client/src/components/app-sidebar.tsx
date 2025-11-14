import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Receipt,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Vendors",
    url: "/vendors",
    icon: Building2,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold">GST Ease Suite</span>
            <span className="text-xs text-muted-foreground">Billing & Inventory</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
      <SidebarFooter className="p-4 border-t space-y-2">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} style={{ objectFit: 'cover' }} />
            <AvatarFallback className="text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              {user?.email}
            </span>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/api/logout'}
            data-testid="button-logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
