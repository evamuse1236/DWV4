import { type HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated";
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const variantStyles = {
  default: "bg-white border border-gray-100 shadow-sm",
  outlined: "bg-white border-2 border-gray-200",
  elevated: "bg-white shadow-lg",
};

/**
 * Card container component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      hoverable = false,
      padding = "md",
      children,
      ...props
    },
    ref
  ) => {
    const baseClassName = cn(
      "rounded-xl",
      variantStyles[variant],
      paddingStyles[padding],
      hoverable && "cursor-pointer transition-shadow",
      className
    );

    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          className={baseClassName}
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)" }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * Card header section
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between mb-4", className)}
        {...props}
      >
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
          {children}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

/**
 * Card body/content section
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("", className)} {...props} />;
});

CardContent.displayName = "CardContent";

/**
 * Card footer section
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-2",
        className
      )}
      {...props}
    />
  );
});

CardFooter.displayName = "CardFooter";

export default Card;
