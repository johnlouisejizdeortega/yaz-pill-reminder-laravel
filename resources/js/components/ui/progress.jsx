import { cn } from "@/lib/utils";

function Progress({ className, value, ...props }) {
  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
      {...props}
    >
      <div
        className="h-full bg-primary transition-none"
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  );
}

export { Progress };
