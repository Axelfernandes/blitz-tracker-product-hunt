import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border border-black/10 dark:border-white/20 bg-white/80 dark:bg-white/10 p-6 shadow-xl backdrop-blur-md",
        "transition-colors hover:bg-white/90 dark:hover:bg-white/15 hover:border-black/20 dark:hover:border-white/30",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      {...props}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent opacity-50" />
      {children}
    </motion.div>
  );
}
