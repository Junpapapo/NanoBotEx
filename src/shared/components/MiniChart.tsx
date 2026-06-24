import React from "react";

interface ChartData {
  title?: string;
  labels: string[];
  values: number[];
}

interface MiniChartProps {
  type: string;
  data: ChartData;
  theme: any;
  isLight: boolean;
}

export function MiniChart({ type, data, theme, isLight }: MiniChartProps) {
  const { title = "통계 데이터 시각화", labels = [], values = [] } = data;
  
  if (values.length === 0) return null;

  const maxVal = Math.max(...values, 1) * 1.1;
  const chartHeight = 130;
  const chartWidth = 280;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 25;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const primaryColorHex = theme.colorCode || "#6366f1";

  const renderBarChart = () => {
    const barCount = values.length;
    const barGap = 8;
    const totalGapWidth = barGap * (barCount - 1);
    const barWidth = (graphWidth - totalGapWidth) / barCount;

    return values.map((val, idx) => {
      const barHeight = (val / maxVal) * graphHeight;
      const x = paddingLeft + idx * (barWidth + barGap);
      const y = chartHeight - paddingBottom - barHeight;

      return (
        <g key={idx} className="group/bar transition-all">
          <rect
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={3}
            fill={primaryColorHex}
            opacity={0.8}
            className="hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          />
          <text
            x={x + barWidth / 2}
            y={y - 4}
            textAnchor="middle"
            fill={isLight ? "#475569" : "#e2e8f0"}
            className="text-[8px] font-black font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200"
          >
            {val.toLocaleString()}
          </text>
          <text
            x={x + barWidth / 2}
            y={chartHeight - 8}
            textAnchor="middle"
            fill={isLight ? "#64748b" : "#94a3b8"}
            className="text-[8px] font-bold"
          >
            {labels[idx] || ""}
          </text>
        </g>
      );
    });
  };

  const renderLineChart = () => {
    const pointCount = values.length;
    const stepX = graphWidth / (pointCount - 1 || 1);
    const points = values.map((val, idx) => {
      const x = paddingLeft + idx * stepX;
      const y = chartHeight - paddingBottom - (val / maxVal) * graphHeight;
      return { x, y, val, label: labels[idx] };
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
      <g>
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`}
          fill={`url(#line-grad-${primaryColorHex.replace('#', '')})`}
          opacity={0.12}
        />
        <path
          d={pathData}
          fill="none"
          stroke={primaryColorHex}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, idx) => (
          <g key={idx} className="group/point">
            <circle
              cx={p.x}
              cy={p.y}
              r={3}
              fill={isLight ? "#ffffff" : "#0c122c"}
              stroke={primaryColorHex}
              strokeWidth={1.5}
              className="hover:scale-125 transition-all duration-200 cursor-pointer"
            />
            <text
              x={p.x}
              y={p.y - 6}
              textAnchor="middle"
              fill={isLight ? "#475569" : "#e2e8f0"}
              className="text-[8px] font-black font-mono opacity-0 group-hover/point:opacity-100 transition-opacity duration-200"
            >
              {p.val.toLocaleString()}
            </text>
            <text
              x={p.x}
              y={chartHeight - 8}
              textAnchor="middle"
              fill={isLight ? "#64748b" : "#94a3b8"}
              className="text-[8px] font-bold"
            >
              {p.label || ""}
            </text>
          </g>
        ))}
      </g>
    );
  };

  const renderPieChart = () => {
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    let accumulatedAngle = 0;
    const centerX = paddingLeft + graphWidth / 2;
    const centerY = paddingTop + graphHeight / 2 - 5;
    const radius = Math.min(graphWidth, graphHeight) / 2 * 0.9;

    const colors = [
      primaryColorHex,
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#f43f5e",
      "#8b5cf6"
    ];

    return values.map((val, idx) => {
      const percentage = (val / total) * 100;
      const angle = (val / total) * 360;
      const radStart = (accumulatedAngle - 90) * Math.PI / 180;
      const radEnd = (accumulatedAngle + angle - 90) * Math.PI / 180;

      const x1 = centerX + radius * Math.cos(radStart);
      const y1 = centerY + radius * Math.sin(radStart);
      const x2 = centerX + radius * Math.cos(radEnd);
      const y2 = centerY + radius * Math.sin(radEnd);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      const color = colors[idx % colors.length];
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;

      const middleAngle = startAngle + angle / 2 - 90;
      const middleRad = middleAngle * Math.PI / 180;
      const labelX = centerX + (radius * 0.6) * Math.cos(middleRad);
      const labelY = centerY + (radius * 0.6) * Math.sin(middleRad);

      return (
        <g key={idx} className="group/slice">
          <path
            d={pathData}
            fill={color}
            opacity={0.8}
            className="hover:opacity-100 transition-opacity duration-200 cursor-pointer stroke-[#070b1e] stroke-[1.5]"
          />
          {percentage > 8 && (
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              fill="#ffffff"
              className="text-[7.5px] font-black pointer-events-none drop-shadow-md"
            >
              {labels[idx] || ""}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className={`mt-3 p-3 rounded-2xl border ${
      isLight ? "bg-white border-slate-200" : "bg-slate-900/40 border-white/[0.04]"
    } flex flex-col items-center select-none shadow-sm`}>
      <span className={`text-[9.5px] font-black mb-2 tracking-wider ${isLight ? "text-slate-700" : "text-indigo-400"} uppercase`}>
        📊 {title}
      </span>
      <svg width={chartWidth} height={chartHeight} className="overflow-visible">
        <defs>
          <linearGradient id={`line-grad-${primaryColorHex.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColorHex} stopOpacity={0.4} />
            <stop offset="100%" stopColor={primaryColorHex} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {type !== "pie" && (
          <g opacity={0.08}>
            <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke={isLight ? "#000" : "#fff"} strokeWidth={1} />
            <line x1={paddingLeft} y1={paddingTop + graphHeight / 2} x2={chartWidth - paddingRight} y2={paddingTop + graphHeight / 2} stroke={isLight ? "#000" : "#fff"} strokeWidth={1} />
            <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke={isLight ? "#000" : "#fff"} strokeWidth={1} />
          </g>
        )}

        {type === "bar" && renderBarChart()}
        {type === "line" && renderLineChart()}
        {type === "pie" && renderPieChart()}
      </svg>
    </div>
  );
}
