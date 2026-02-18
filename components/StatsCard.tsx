'use client';

import { useEffect, useState, useRef } from "react";
import { GlassCard } from "./GlassCard";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: string;
    suffix?: string;
}

function AnimatedCounter({ 
    value, 
    suffix = "",
    inView 
}: { 
    value: string | number; 
    suffix?: string;
    inView: boolean;
}) {
    const numericValue = typeof value === 'string' 
        ? parseFloat(value.replace(/,/g, '')) 
        : value;
    
    const [displayValue, setDisplayValue] = useState(0);
    const isNumeric = !isNaN(numericValue);

    useEffect(() => {
        if (!inView || !isNumeric) {
            setDisplayValue(numericValue);
            return;
        }

        const duration = 1500;
        const steps = 60;
        const increment = numericValue / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                setDisplayValue(numericValue);
                clearInterval(timer);
            } else {
                setDisplayValue(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [inView, numericValue, isNumeric]);

    if (!isNumeric) {
        return <span>{value}{suffix}</span>;
    }

    const formatted = Number.isInteger(numericValue) 
        ? Math.round(displayValue).toLocaleString()
        : displayValue.toFixed(1);

    return (
        <span>
            {formatted}{suffix}
        </span>
    );
}

export function StatsCard({ title, value, icon: Icon, trend, color = "text-[#FF958C]", suffix }: StatsCardProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <GlassCard className="flex items-center gap-4 p-6">
            <div className={cn("p-3 rounded-xl bg-white/5 border border-white/10", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-white/60 font-medium">{title}</p>
                <motion.p 
                    ref={ref}
                    className="text-2xl font-bold text-white mt-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <AnimatedCounter 
                        value={value} 
                        suffix={suffix} 
                        inView={isInView} 
                    />
                </motion.p>
                {trend && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={cn(
                            "text-xs mt-1 font-semibold",
                            trend.isPositive ? "text-green-400" : "text-red-400"
                        )}
                    >
                        {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                    </motion.p>
                )}
            </div>
        </GlassCard>
    );
}
