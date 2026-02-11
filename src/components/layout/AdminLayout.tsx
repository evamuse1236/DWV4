import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
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
  Mic,
  FolderKanban,
  Search,
  ListChecks,
  Settings,
  MessageSquare,
  Sparkles,
} from "lucide-react";

// Admin navigation items
const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: Home },
  { path: "/admin/students", label: "Students", icon: Users },
  { path: "/admin/norms", label: "Norms", icon: ListChecks },
  { path: "/admin/sprints", label: "Sprints", icon: Calendar },
  { path: "/admin/projects", label: "Projects", icon: FolderKanban },
  { path: "/admin/objectives", label: "Objectives", icon: Target },
  { path: "/admin/viva", label: "Viva Queue", icon: CheckCircle },
  { path: "/admin/presentations", label: "Presentations", icon: Mic },
  { path: "/admin/books", label: "Books", icon: BookOpen },
  { path: "/admin/character", label: "Character", icon: Sparkles },
  { path: "/admin/comments", label: "Comments", icon: MessageSquare },
  { path: "/admin/trust-jar", label: "Trust Jar", icon: Cookie },
  { path: "/admin/settings", label: "Settings", icon: Settings },
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
  const navigate = useNavigate();

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const students = useQuery(api.users.getAll);

  // Global Cmd+K shortcut
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

      <SidebarInset>
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
          </div>
          <Outlet />
        </main>
      </SidebarInset>

      {/* Floating search pill */}
      <button
        onClick={() => setSearchOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full
          border border-border/60 bg-background/80 px-4 py-2.5 text-sm text-muted-foreground
          shadow-lg backdrop-blur-md transition-all duration-200
          hover:bg-background hover:text-foreground hover:shadow-xl hover:scale-105
          active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Search students (Cmd+K)"
      >
        <Search className="h-4 w-4" />
        <kbd className="pointer-events-none flex h-5 select-none items-center gap-0.5
          rounded border border-border/40 bg-muted/60 px-1.5 font-mono text-[10px] font-medium">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Global search dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search students..." />
        <CommandList>
          <CommandEmpty>No students found.</CommandEmpty>
          <CommandGroup heading="Students">
            {students?.map((student: any) => (
              <CommandItem
                key={student._id}
                onSelect={() => handleSelectStudent(student._id)}
                className="flex items-center gap-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {student.displayName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{student.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{student.username}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}

export default AdminLayout;
