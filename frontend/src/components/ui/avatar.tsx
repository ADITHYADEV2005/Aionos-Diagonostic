import * as React from "react";

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div
      ref={ref}
      style={{
        display: "flex",
        height: "40px",
        width: "40px",
        borderRadius: "9999px",
        overflow: "hidden",
        backgroundColor: "#e5e7eb",
      }}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ ...props }, ref) => (
    <img
      ref={ref}
      style={{
        aspectRatio: "1",
        height: "100%",
        width: "100%",
        objectFit: "cover",
      }}
      {...props}
    />
  )
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: "#d1d5db",
        color: "#111",
        fontSize: "14px",
        fontWeight: 500,
      }}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
