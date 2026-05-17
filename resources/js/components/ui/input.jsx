import { cn } from "@/lib/utils";

const Input = ({ className, type, ...props }) => {
  return (
    <input
      type={type}
      className={cn(
        "glass-input flex h-11 w-full max-w-full min-w-0 rounded-lg px-3 py-1 text-sm text-black/85 placeholder:text-black/30",
        className
      )}
      {...props}
    />
  );
};

export { Input };
