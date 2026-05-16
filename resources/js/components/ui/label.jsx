import { cn } from "@/lib/utils";

const Label = ({ className, ...props }) => (
  <label
    className={cn(
      "text-xs font-semibold text-black/50 uppercase tracking-wider",
      className
    )}
    {...props}
  />
);

export { Label };
