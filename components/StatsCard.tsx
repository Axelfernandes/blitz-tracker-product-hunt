import { GlassCard } from "./GlassCard";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, color = "text-cyan-400" }: StatsCardProps) {
    return (
        <GlassCard className="flex items-center gap-4 p-6">
            <div className={cn("p-3 rounded-xl bg-white/5 border border-white/10", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-white/60 font-medium">{title}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
                {trend && (
                    <p className={cn(
                        "text-xs mt-1 font-semibold",
                        trend.isPositive ? "text-green-400" : "text-red-400"
                    )}>
                        {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </p>
                )}
            </div>
        </GlassCard>
    );
}
