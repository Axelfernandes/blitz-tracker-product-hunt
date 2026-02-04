'use client';

import { motion } from "framer-motion";

interface ScoreChartProps {
    scores: {
        speed: number;
        market: number;
        pmf: number;
        network: number;
        growth: number;
        uncertainty?: number;
    };
}

export function ScoreChart({ scores }: ScoreChartProps) {
    const criteria = [
        { name: "Speed", value: scores.speed, angle: 0 },
        { name: "Market", value: scores.market, angle: 60 },
        { name: "PMF", value: scores.pmf, angle: 120 },
        { name: "Network", value: scores.network, angle: 180 },
        { name: "Growth", value: scores.growth, angle: 240 },
        { name: "Uncertainty", value: scores.uncertainty || scores.speed, angle: 300 },
    ];

    const center = 100;
    const radius = 75;
    const maxScore = 10;

    // Calculate points for the polygon
    const points = criteria.map(({ value, angle }) => {
        const radian = (angle - 90) * (Math.PI / 180);
        const distance = (value / maxScore) * radius;
        const x = center + distance * Math.cos(radian);
        const y = center + distance * Math.sin(radian);
        return `${x},${y}`;
    }).join(' ');

    // Calculate label positions
    const labels = criteria.map(({ name, value, angle }) => {
        const radian = (angle - 90) * (Math.PI / 180);
        const labelDistance = radius + 25;
        const x = center + labelDistance * Math.cos(radian);
        const y = center + labelDistance * Math.sin(radian);
        return { name, value, x, y };
    });

    return (
        <div className="flex items-center justify-center p-4">
            <svg width="260" height="260" viewBox="0 0 200 200" className="overflow-visible">
                {/* Gradients and Filters */}
                <defs>
                    <radialGradient id="polyGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                        <stop offset="100%" stopColor="rgba(6, 182, 212, 0.1)" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circles/webs */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
                    <circle
                        key={scale}
                        cx={center}
                        cy={center}
                        r={radius * scale}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis lines */}
                {criteria.map(({ angle }) => {
                    const radian = (angle - 90) * (Math.PI / 180);
                    const x = center + radius * Math.cos(radian);
                    const y = center + radius * Math.sin(radian);
                    return (
                        <line
                            key={angle}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    );
                })}

                {/* Score polygon */}
                <motion.polygon
                    points={points}
                    fill="url(#polyGradient)"
                    stroke="rgba(6, 182, 212, 0.8)"
                    strokeWidth="2"
                    filter="url(#glow)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                />

                {/* Score points */}
                {criteria.map(({ value, angle, name }) => {
                    const radian = (angle - 90) * (Math.PI / 180);
                    const distance = (value / maxScore) * radius;
                    const x = center + distance * Math.cos(radian);
                    const y = center + distance * Math.sin(radian);
                    return (
                        <motion.circle
                            key={name}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#22d3ee"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                        />
                    );
                })}

                {/* Labels with improved contrast and layout */}
                {labels.map(({ name, x, y }) => (
                    <text
                        key={name}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[10px] font-black fill-white/80 uppercase tracking-tighter"
                    >
                        {name}
                    </text>
                ))}
            </svg>
        </div>
    );
}

