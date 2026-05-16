import { cn } from "@/lib/utils";

const Input = ({ className, type, ...props }) => {
  return (
    <input
      type={type}
      className={cn(
        "glass-input flex h-8 w-full rounded-lg px-3 py-1 text-xs text-black/85 placeholder:text-black/30",
        className
      )}
      {...props}
    />
  );
};

export { Input };
