import React, { useState } from 'react';
import { motion } from 'framer-motion';

// --- Donut Chart ---
interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
}

export const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~314.159
  
  let currentOffset = 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
        No active task distribution data
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
      {/* Donut Circle */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {data.map((item, idx) => {
            if (item.value === 0) return null;
            const percentage = item.value / total;
            const strokeLength = percentage * circumference;
            const strokeOffset = -currentOffset;
            currentOffset += strokeLength;

            const isHovered = hoveredIdx === idx;

            return (
              <motion.circle
                key={item.name}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center overlay details */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-display tracking-tight">
            {hoveredIdx !== null ? data[hoveredIdx].value : total}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
            {hoveredIdx !== null ? data[hoveredIdx].name : 'Total Tasks'}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-col gap-2">
        {data.map((item, idx) => {
          if (item.value === 0) return null;
          return (
            <div
              key={item.name}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                hoveredIdx === idx ? 'bg-slate-500/10 dark:bg-white/5' : ''
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium capitalize">
                {item.name.toLowerCase().replace('_', ' ')}
              </span>
              <span className="text-sm font-bold ml-auto pl-4">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- Area Chart ---
interface DataPoint {
  name: string;
  completed: number;
}

interface AreaChartProps {
  data: DataPoint[];
}

export const AreaChart: React.FC<AreaChartProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - 2 * paddingX;
  const chartHeight = height - 2 * paddingY;

  const maxVal = Math.max(...data.map((d) => d.completed), 4); // default axis threshold min 4

  // Generate points
  const points = data.map((d, index) => {
    const x = paddingX + (index * chartWidth) / (data.length - 1);
    const y = height - paddingY - (d.completed * chartHeight) / maxVal;
    return { x, y, val: d.completed, name: d.name };
  });

  // SVG Line path string creator
  const linePath = points.reduce((path, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  // SVG Gradient Area path string creator (closes the polygon at baseline)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="w-full relative">
      <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* 1. Grid Horizontal Guidelines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = paddingY + r * chartHeight;
          const gridVal = Math.round(maxVal * (1 - r));
          return (
            <g key={idx} className="opacity-40">
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-slate-300 dark:text-slate-800"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 10}
                y={y + 4}
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono text-right"
                textAnchor="end"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* 2. Gradient Area Fill */}
        {areaPath && (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            d={areaPath}
            fill="url(#areaGrad)"
          />
        )}

        {/* 3. Smooth Accent Path Line */}
        {linePath && (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            d={linePath}
            fill="transparent"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* 4. Axis Labels */}
        {points.map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={height - paddingY + 18}
            className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
            textAnchor="middle"
          >
            {p.name}
          </text>
        ))}

        {/* 5. Tooltip Guide Vertical Line */}
        {hoveredPoint !== null && (
          <line
            x1={points[hoveredPoint].x}
            y1={paddingY}
            x2={points[hoveredPoint].x}
            y2={height - paddingY}
            stroke="#6366f1"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* 6. Active Points Circles */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint === idx ? 6 : 4}
            className="fill-white dark:fill-slate-900 stroke-brand-500 transition-all duration-150 cursor-pointer"
            strokeWidth="2.5"
            onMouseEnter={() => setHoveredPoint(idx)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* 7. Floating Hover HTML Tooltip */}
      {hoveredPoint !== null && (
        <div
          className="absolute glass-panel px-3 py-1.5 rounded-xl shadow-xl text-xs font-semibold pointer-events-none transition-all duration-75 z-10 flex flex-col gap-0.5"
          style={{
            left: `${(points[hoveredPoint].x / width) * 100}%`,
            top: `${(points[hoveredPoint].y / height) * 100 - 24}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="text-slate-400 text-[10px] font-medium">{points[hoveredPoint].name}</span>
          <span>{points[hoveredPoint].val} Tasks Done</span>
        </div>
      )}
    </div>
  );
};
