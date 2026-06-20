import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        style={{borderColor: '#E8E3DE', backgroundColor: '#FAF7F2', color: '#2d3436'}}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#FF7B6B';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,123,107,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E8E3DE';
          e.currentTarget.style.boxShadow = 'none';
        }}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
