import React from "react";
import { cn } from "@/utils/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hero?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hero = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-warm-white rounded-2xl p-6 transition-all duration-300",
          "hover:atlantic-shadow cursor-default",
          hero ? "p-8 md:p-10 border border-mist-white/50 bg-gradient-to-br from-warm-white to-mist-white" : "border border-transparent",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
