import { useEffect, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * Shared pieces for the admin decision queues (Viva, Diagnostics).
 * Pattern: left list panel with search + keyboard navigation, right
 * evidence pane with a decision panel. Both queue pages compose these
 * so the two workspaces feel like one tool.
 */

/** Arrow-key / j-k navigation across a queue list. Skips when typing. */
export function useQueueKeyboardNav(
  ids: string[],
  selectedId: string | null,
  onSelect: (id: string) => void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (ids.length === 0) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      const isNext = e.key === "ArrowDown" || e.key === "j";
      const isPrev = e.key === "ArrowUp" || e.key === "k";
      if (!isNext && !isPrev) return;

      e.preventDefault();
      const currentIndex = selectedId ? ids.indexOf(selectedId) : -1;
      const nextIndex = isNext
        ? Math.min(ids.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
      const nextId = ids[nextIndex];
      if (nextId && nextId !== selectedId) onSelect(nextId);
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [ids, selectedId, onSelect]);
}

export function QueueLayout({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">{children}</div>;
}

interface QueueListPanelProps {
  title: string;
  count: number;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional slot between search and the list (e.g. tabs) */
  toolbar?: ReactNode;
  children: ReactNode;
}

export function QueueListPanel({
  title,
  count,
  search,
  onSearchChange,
  searchPlaceholder = "Search student or objective",
  toolbar,
  children,
}: QueueListPanelProps) {
  return (
    <Card className="h-fit border-black/10 bg-white/80 shadow-none xl:sticky xl:top-6">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-serif text-xl">{title}</CardTitle>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            {count}
          </span>
        </div>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="border-black/10 bg-white"
        />
        {toolbar}
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-16rem)] space-y-2.5 overflow-y-auto">
        {children}
      </CardContent>
      <div className="border-t border-border/60 px-6 py-2.5 text-[11px] text-muted-foreground">
        <span className="font-mono">↑↓</span> or <span className="font-mono">j k</span> to move
        between requests
      </div>
    </Card>
  );
}

interface QueueListItemProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function QueueListItem({ active, onClick, children, className }: QueueListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative w-full rounded-2xl border px-4 py-3.5 text-left transition-colors",
        active
          ? "border-primary/30 bg-accent/40 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
          : "border-black/10 bg-background/60 hover:bg-background",
        className
      )}
    >
      {children}
    </button>
  );
}

export function QueueEmptyList({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function AllClearPanel({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-black/10 bg-white/80 shadow-none">
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center">
        <Sparkles className="h-6 w-6 text-primary" />
        <p className="font-serif text-xl text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

export function SelectPrompt({ label }: { label: string }) {
  return (
    <Card className="border-black/10 bg-white/80 shadow-none">
      <CardContent className="flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">
        {label}
      </CardContent>
    </Card>
  );
}
