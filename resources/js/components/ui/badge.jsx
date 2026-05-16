import { cn } from "@/lib/utils";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default:     "bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/20",
    secondary:   "bg-black/6 text-black/50 border border-black/8",
    destructive: "bg-[#FF3B30]/12 text-[#FF3B30] border border-[#FF3B30]/20",
    success:     "bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/20",
    warning:     "bg-[#FF9500]/15 text-[#FF9500] border border-[#FF9500]/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
