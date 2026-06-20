import logoImage from "@/assets/aionos-logo.png";
import { cn } from "@/lib/utils";

interface AionosLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const AionosLogo = ({ size = "md", showText = true }: AionosLogoProps) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-12 h-12", 
    lg: "w-20 h-20"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={logoImage} 
        alt="AIONOS DIAGNOSTICS" 
        className={cn(sizeClasses[size], "drop-shadow-md object-contain")}
        style={{ maxWidth: "200px", maxHeight: "200px" }}
      />
      {showText && (
        <div className="text-center">
          <h2 className={cn("font-bold text-black", textSizeClasses[size])}>
            AIONOS DIAGNOSTICS
          </h2>
          <p className="text-xs text-white mt-1">
            INTELLIGENT INSIGHTS. ANYTIME, ANYWHERE.
          </p>
        </div>
      )}
    </div>
  );
};