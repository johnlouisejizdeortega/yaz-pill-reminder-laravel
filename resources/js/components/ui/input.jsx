import { cn } from "@/lib/utils";

const Input = ({ className, type, ...props }) => {
  return (
    <input
      type={type}
      className={cn(
        "glass-input flex h-11 w-full rounded-xl px-4 py-2 text-sm text-black/85 placeholder:text-black/30",
        className
      )}
      {...props}
    />
  );
};

export { Input };
