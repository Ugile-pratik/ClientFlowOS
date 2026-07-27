import React, { useState } from 'react';
import { Box, Typography, Card, useTheme } from '@mui/material';

const RevenueChart = ({ data = [] }) => {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
        <Typography color="text.secondary">No revenue data available</Typography>
      </Box>
    );
  }

  // Chart config
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find max value for Y scaling (at least 10000 to prevent divide by zero / flat chart)
  const maxAmount = Math.max(...data.map(d => d.amount), 10000);
  const roundedMax = Math.ceil(maxAmount / 10000) * 10000;

  // Scales
  const getX = (index) => paddingLeft + (index / (data.length - 1)) * chartWidth;
  const getY = (amount) => paddingBottom + chartHeight - (amount / roundedMax) * chartHeight;

  // Draw smooth path (Bezier Curve)
  let linePath = '';
  let areaPath = '';

  if (data.length > 0) {
    const points = data.map((d, index) => ({ x: getX(index), y: getY(d.amount) }));

    // Bezier line builder
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    // Area path (closed loop back to bottom of chart)
    areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;
  }

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = getX(index);
    const y = getY(data[index].amount);
    
    // Scale local point to viewport bounds
    const scaleX = rect.width / svgWidth;
    const scaleY = rect.height / svgHeight;

    setHoveredIndex(index);
    setTooltipPos({
      x: x * scaleX,
      y: y * scaleY - 60
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Generate grid values (4 lines)
  const gridLines = [0, 0.33, 0.66, 1];

  return (
    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Monthly Earnings
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Revenue tracking over the past 6 months
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="caption" color="text.secondary">Revenue</Typography>
          </Box>
        </Box>
      </Box>

      {/* SVG Canvas */}
      <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity="0.25" />
              <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {gridLines.map((ratio, i) => {
            const val = ratio * roundedMax;
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={theme.palette.divider}
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fill={theme.palette.text.secondary}
                  fontSize="10"
                  textAnchor="end"
                  fontFamily={theme.typography.fontFamily}
                >
                  ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* X Axis Months */}
          {data.map((d, index) => {
            const x = getX(index);
            return (
              <text
                key={index}
                x={x}
                y={svgHeight - paddingBottom + 20}
                fill={theme.palette.text.secondary}
                fontSize="11"
                fontWeight={500}
                textAnchor="middle"
                fontFamily={theme.typography.fontFamily}
              >
                {d.month}
              </text>
            );
          })}

          {/* Area under the line */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#chartGradient)"
            />
          )}

          {/* Line stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={theme.palette.primary.main}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Interactive Dots & Hover zones */}
          {data.map((d, index) => {
            const x = getX(index);
            const y = getY(d.amount);
            const isHovered = index === hoveredIndex;

            return (
              <g key={index}>
                {/* Visual Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? theme.palette.primary.main : theme.palette.background.paper}
                  stroke={theme.palette.primary.main}
                  strokeWidth={isHovered ? 2.5 : 2}
                  style={{ transition: 'all 150ms ease-in-out' }}
                />

                {/* Larger transparent hover capture circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="24"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onMouseLeave={handleMouseLeave}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover HTML Tooltip */}
        {hoveredIndex !== null && (
          <Box
            sx={{
              position: 'absolute',
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: 'translateX(-50%)',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: theme.shadows[3],
              borderRadius: 2,
              p: 1,
              px: 1.5,
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'fadeIn 100ms ease-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateX(-50%) translateY(4px)' },
                to: { opacity: 1, transform: 'translateX(-50%)' }
              }
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {data[hoveredIndex].month} {data[hoveredIndex].year}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ₹{data[hoveredIndex].amount.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default RevenueChart;
