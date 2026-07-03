import { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/shared/ui/command";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
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
  Search,
  ListChecks,
  Settings,
} from "lucide-react";

const coachWorkNavItems = [
  { path: "/admin", label: "Today", icon: Home },
  { path: "/admin/students", label: "Students", icon: Users },
  { path: "/admin/objectives", label: "Units", icon: Target },
  {
    path: "/admin/confirmations",
    label: "Confirmations",
    icon: CheckCircle,
    badge: "confirmations" as const,
  },
];

const manageNavItems = [
  { path: "/admin/sprints", label: "Sprints", icon: Calendar },
  { path: "/admin/projects", label: "Data", icon: ListChecks },
  { path: "/admin/books", label: "Books", icon: BookOpen },
  { path: "/admin/norms", label: "Norms", icon: ListChecks },
  { path: "/admin/trust-jar", label: "Trust Jar", icon: Cookie },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

type AdminNavItem = (typeof coachWorkNavItems)[number] & {
  badge?: "confirmations";
};

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

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const SEARCH_SHORTCUT_LABEL = IS_MAC ? "⌘K" : "Ctrl+K";

/**
 * Admin layout — "The Coach's Ledger".
 * Warm sepia shadcn sidebar shell with live queue badges, a platform-aware
 * command palette for jumping to students, and a steady serif/sans rhythm.
 */
export function AdminLayout() {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const students = useQuery(
    api.users.getAll,
    token ? { adminToken: token } : "skip"
  );

  // Live confirmation count surfaced as a nav badge so pending decisions
  // are visible from anywhere in the ledger.
  const confirmationQueue = useQuery(
    api.assignments.getConfirmationQueue,
    token ? { adminToken: token } : "skip"
  );

  const badgeCounts = useMemo(
    () => ({
      confirmations: confirmationQueue?.length ?? 0,
    }),
    [confirmationQueue]
  );

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelectStudent = (studentId: string) => {
    setSearchOpen(false);
    navigate(`/admin/students/${studentId}`);
  };

  const renderNavSection = (items: AdminNavItem[]) =>
    items.map((item) => {
      const count = item.badge ? badgeCounts[item.badge] : 0;
      return (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            asChild
            isActive={isNavItemActive(item.path, location.pathname)}
            tooltip={item.label}
            className="data-[active=true]:relative data-[active=true]:before:absolute data-[active=true]:before:inset-y-1.5 data-[active=true]:before:left-0 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary"
          >
            <NavLink to={item.path}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          </SidebarMenuButton>
          {count > 0 && (
            <SidebarMenuBadge className="rounded-full bg-primary px-1.5 font-mono text-[10px] font-medium text-primary-foreground">
              {count}
            </SidebarMenuBadge>
          )}
        </SidebarMenuItem>
      );
    });

  return (
    <SidebarProvider className="ledger">
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-serif font-bold">
              DW
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-lg font-semibold">Deep Work</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Coach&apos;s Ledger
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Coach Work</SidebarGroupLabel>
            <SidebarGroupContent>
              <Button
                variant="outline"
                className="mb-3 w-full justify-between border-dashed"
                onClick={() => setSearchOpen(true)}
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Open student
                </span>
                <span className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                  {SEARCH_SHORTCUT_LABEL}
                </span>
              </Button>
              <SidebarMenu>{renderNavSection(coachWorkNavItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavSection(manageNavItems)}</SidebarMenu>
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

      <SidebarInset>
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mb-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>

      {/* Global search dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search students..." />
        <CommandList>
          <CommandEmpty>No students found.</CommandEmpty>
          <CommandGroup heading="Students">
            {students?.map((student: any) => (
              <CommandItem
                key={student._id}
                value={`${student.displayName} ${student.username} ${student.batch ?? ""}`}
                onSelect={() => handleSelectStudent(student._id)}
                className="flex items-center gap-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {student.displayName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{student.displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    @{student.username}
                  </span>
                </div>
                {student.batch && (
                  <span className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {student.batch}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}

export default AdminLayout;
