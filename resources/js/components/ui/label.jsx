import { cn } from "@/lib/utils";

const Label = ({ className, ...props }) => (
  <label
    className={cn(
      "text-[10px] font-medium leading-none tracking-widest uppercase text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
);

export { Label };
