import { type HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const variantStyles = {
  default: "bg-primary-600",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  gradient: "bg-gradient-to-r from-primary-500 to-purple-500",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

/**
 * Progress bar component with animations
 */
export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      variant = "default",
      size = "md",
      showLabel = false,
      label,
      animated = true,
      className,
      ...props
    },
    ref
  ) => {
    // Clamp value between 0 and max
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Label row */}
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-1">
            {label && (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            )}
            {showLabel && (
              <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
            )}
          </div>
        )}

        {/* Progress track */}
        <div
          className={cn(
            "w-full bg-gray-200 rounded-full overflow-hidden",
            sizeStyles[size]
          )}
        >
          {/* Progress fill */}
          <motion.div
            initial={animated ? { width: 0 } : { width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              variantStyles[variant]
            )}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

/**
 * Circular progress indicator
 */
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning" | "danger";
}

const circularVariantColors = {
  default: "#6366F1",
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
};

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  variant = "default",
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circularVariantColors[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-sm font-semibold text-gray-700">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export default ProgressBar;
