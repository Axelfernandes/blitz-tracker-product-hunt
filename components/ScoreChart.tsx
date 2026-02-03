'use client';

import { motion } from "framer-motion";

interface ScoreChartProps {
    scores: {
        speed: number;
        market: number;
        pmf: number;
        network: number;
        growth: number;
    };
}

export function ScoreChart({ scores }: ScoreChartProps) {
    const criteria = [
        { name: "Speed", value: scores.speed, angle: 0 },
        { name: "Market", value: scores.market, angle: 72 },
        { name: "PMF", value: scores.pmf, angle: 144 },
        { name: "Network", value: scores.network, angle: 216 },
        { name: "Growth", value: scores.growth, angle: 288 },
    ];

    const center = 100;
    const radius = 80;
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
        const labelDistance = radius + 20;
        const x = center + labelDistance * Math.cos(radian);
        const y = center + labelDistance * Math.sin(radian);
        return { name, value, x, y };
    });

    return (
        <div className="flex items-center justify-center p-4">
            <svg width="240" height="240" viewBox="0 0 200 200" className="overflow-visible">
                {/* Background circles */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
                    <circle
                        key={scale}
                        cx={center}
                        cy={center}
                        r={radius * scale}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
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
                        />
                    );
                })}

                {/* Score polygon */}
                <motion.polygon
                    points={points}
                    fill="rgba(6, 182, 212, 0.2)"
                    stroke="rgba(6, 182, 212, 0.8)"
                    strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />

                {/* Score points */}
                {criteria.map(({ value, angle }) => {
                    const radian = (angle - 90) * (Math.PI / 180);
                    const distance = (value / maxScore) * radius;
                    const x = center + distance * Math.cos(radian);
                    const y = center + distance * Math.sin(radian);
                    return (
                        <motion.circle
                            key={angle}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#06b6d4"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        />
                    );
                })}

                {/* Labels */}
                {labels.map(({ name, value, x, y }) => (
                    <g key={name}>
                        <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            className="text-[10px] font-semibold fill-white/80"
                        >
                            {name}
                        </text>
                        <text
                            x={x}
                            y={y + 12}
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-cyan-400"
                        >
                            {value}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
