import { cn } from "@/lib/utils";

export function Card({ className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        "glass rounded-xl overflow-hidden",
        hover && "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-[13.5px] font-semibold text-slate-100", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}
