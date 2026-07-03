import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Right-aligned primary actions (buttons, dialogs) */
  actions?: ReactNode;
  /** Small contextual chips (counts, status) rendered before actions */
  meta?: ReactNode;
  className?: string;
}

/**
 * Shared admin page header — eyebrow small-caps, serif display title,
 * one-line description, and a right-aligned action slot. Every admin
 * page opens with this so the ledger keeps a steady rhythm.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="truncate">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {(meta || actions) && (
        <div className="flex shrink-0 items-center gap-3 pb-1">
          {meta}
          {actions}
        </div>
      )}
    </header>
  );
}

export default AdminPageHeader;
