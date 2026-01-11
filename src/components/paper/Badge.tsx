import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  outline: "bg-transparent border border-gray-300 text-gray-700",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
};

/**
 * Badge component for status indicators, tags, and labels
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

/**
 * Status badge with a dot indicator
 */
export interface StatusBadgeProps extends BadgeProps {
  status?: "online" | "offline" | "busy" | "away";
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-yellow-500",
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status = "offline", children, className, ...props }, ref) => {
    return (
      <Badge ref={ref} variant="outline" className={cn("gap-1.5", className)} {...props}>
        <span className={cn("w-2 h-2 rounded-full", statusColors[status])} />
        {children}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export default Badge;
