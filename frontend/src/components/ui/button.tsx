import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", style, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      padding: size === "sm" ? "6px 12px" : size === "lg" ? "12px 24px" : "8px 16px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      border: "none",
      transition: "all 0.2s",
      ...style,
    };

    const variantStyle: React.CSSProperties = 
      variant === "outline" ? { border: "2px solid #FF7B6B", backgroundColor: "#FAF7F2", color: "#FF7B6B" } :
      variant === "ghost" ? { backgroundColor: "transparent", color: "#2d3436" } :
      variant === "link" ? { backgroundColor: "transparent", color: "#FF7B6B", textDecoration: "underline" } :
      { backgroundColor: "#FF7B6B", color: "white" };

    return (
      <button ref={ref} style={{ ...baseStyle, ...variantStyle }} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button };

