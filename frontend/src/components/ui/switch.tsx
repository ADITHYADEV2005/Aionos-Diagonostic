import * as React from "react";

const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      style={{
        width: "44px",
        height: "24px",
        cursor: "pointer",
        accent: "#3b82f6",
      }}
      {...props}
    />
  )
);
Switch.displayName = "Switch";

export { Switch };
