import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Users,
  Calendar,
  Target,
  CheckCircle,
  BookOpen,
  LogOut,
  ChevronUp,
  Cookie,
} from "lucide-react";

// Admin navigation items
const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: Home },
  { path: "/admin/students", label: "Students", icon: Users },
  { path: "/admin/sprints", label: "Sprints", icon: Calendar },
  { path: "/admin/objectives", label: "Objectives", icon: Target },
  { path: "/admin/viva", label: "Viva Queue", icon: CheckCircle },
  { path: "/admin/books", label: "Books", icon: BookOpen },
  { path: "/admin/trust-jar", label: "Trust Jar", icon: Cookie },
];

/**
 * Checks if a nav item is active based on current pathname.
 * Dashboard ("/admin") requires exact match; other routes use prefix matching.
 */
function isNavItemActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === "/admin") {
    return currentPath === itemPath;
  }
  return currentPath.startsWith(itemPath);
}

/**
 * Admin layout using shadcn/ui sidebar
 * Uses the custom TweakCN theme with warm sepia tones
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-serif font-bold">
              DW
            </div>
            <span className="font-serif text-lg font-semibold">Deep Work</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavItemActive(item.path, location.pathname)}
                      tooltip={item.label}
                    >
                      <NavLink to={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {user?.displayName?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.displayName}</span>
                      <span className="truncate text-xs text-muted-foreground capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback className="rounded-lg">
                          {user?.displayName?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          @{user?.username}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="md:ml-64">
        {/* Header with trigger */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="font-serif text-lg font-semibold">
            {adminNavItems.find((item) => isNavItemActive(item.path, location.pathname))?.label ||
              "Admin"}
          </h1>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayout;
