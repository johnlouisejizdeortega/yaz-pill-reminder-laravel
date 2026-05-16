import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "glass rounded-3xl overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("px-6 pt-6 pb-2", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-xl font-semibold tracking-tight text-black/85", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-xs font-medium text-black/40 uppercase tracking-widest mb-1", className)} {...props} />
  );
}

function CardContent({ className, ...props }) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center px-6 pb-6", className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
