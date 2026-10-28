import React, { useState, useRef, useMemo } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { TrendingUp, TrendingDown, Activity, Maximize2, Zap, BarChart2 } from 'lucide-react';

export const StockMarketChart = ({ 
  data = [], 
  height = 260,
  title = "Expenditure Trajectory",
  subtext = "Real-time financial trend graph",
  periodTotal = null,
  periodLabel = null,
  periodDelta = null,
  periodDeltaLabel = null
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line' (straight line) | 'candles' (bars) | 'smooth' (spline)
  const svgRef = useRef(null);

  // Reset interactive selection whenever data or period changes
  React.useEffect(() => {
    setSelectedIndex(null);
    setHoverIndex(null);
  }, [data, periodTotal]);

  const effectiveIndex = hoverIndex !== null ? hoverIndex : selectedIndex;

  // Normalize data points
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((d, i) => {
      const amount = typeof d.totalSpent === 'number' ? d.totalSpent : (parseFloat(d.totalSpent) || 0);
      const monthName = d.month ? String(d.month).replace(/\s+\d{4}$/, '') : '';
      const label = monthName ? monthName.slice(0, 3) : (d.yearMonth ? d.yearMonth.slice(5) : `P${i + 1}`);
      const fullLabel = d.yearMonth
        ? `${monthName || d.yearMonth.slice(5)} ${d.yearMonth.slice(0, 4)}`
        : (monthName || `Period ${i + 1}`);
      const txCount = d.transactionCount || 1;
      return {
        ...d,
        index: i,
        amount,
        label,
        fullLabel,
        txCount
      };
    });
  }, [data]);

  // Compute scale boundaries
  const { minVal, maxVal, highPoint, lowPoint } = useMemo(() => {
    if (points.length === 0) return { minVal: 0, maxVal: 1000, highPoint: null, lowPoint: null };
    
    let min = points[0].amount;
    let max = points[0].amount;
    let high = points[0];
    let low = points[0];

    points.forEach(p => {
      if (p.amount > max) { max = p.amount; high = p; }
      if (p.amount < min) { min = p.amount; low = p; }
    });

    // Provide breathing room at top and bottom
    const ceiling = max === 0 ? 1000 : max * 1.18;
    const floor = 0;

    return { minVal: floor, maxVal: ceiling, highPoint: high, lowPoint: low };
  }, [points]);

  // Dimensions & Coordinates calculation
  const svgWidth = 600;
  const svgHeight = height;
  const padLeft = 24;
  const padRight = 65;
  const padTop = 28;
  const padBottom = 32;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const getX = (index) => {
    if (points.length <= 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    const range = maxVal - minVal;
    if (range === 0) return padTop + chartHeight / 2;
    const normalized = (val - minVal) / range;
    return padTop + chartHeight - normalized * chartHeight;
  };

  // Generate Straight Line and Smooth Spline Paths
  const { straightLinePath, straightAreaPath, smoothLinePath, smoothAreaPath, coords } = useMemo(() => {
    if (points.length === 0) return { straightLinePath: '', straightAreaPath: '', smoothLinePath: '', smoothAreaPath: '', coords: [] };

    const calculatedCoords = points.map((p, i) => ({
      x: getX(i),
      y: getY(p.amount),
      data: p
    }));

    if (calculatedCoords.length === 1) {
      const c = calculatedCoords[0];
      const singleLine = `M ${padLeft},${c.y} L ${svgWidth - padRight},${c.y}`;
      const singleArea = `M ${padLeft},${c.y} L ${svgWidth - padRight},${c.y} L ${svgWidth - padRight},${padTop + chartHeight} L ${padLeft},${padTop + chartHeight} Z`;
      return {
        straightLinePath: singleLine,
        straightAreaPath: singleArea,
        smoothLinePath: singleLine,
        smoothAreaPath: singleArea,
        coords: calculatedCoords
      };
    }

    const lastX = calculatedCoords[calculatedCoords.length - 1].x;
    const firstX = calculatedCoords[0].x;
    const bottomY = padTop + chartHeight;

    // 1. Straight discrete point-to-point line (represents actual monthly expense totals)
    let straightD = `M ${calculatedCoords[0].x},${calculatedCoords[0].y}`;
    for (let i = 1; i < calculatedCoords.length; i++) {
      straightD += ` L ${calculatedCoords[i].x},${calculatedCoords[i].y}`;
    }
    const straightArea = `${straightD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    // 2. Smooth cubic bezier curve
    let smoothD = `M ${calculatedCoords[0].x},${calculatedCoords[0].y}`;
    for (let i = 0; i < calculatedCoords.length - 1; i++) {
      const curr = calculatedCoords[i];
      const next = calculatedCoords[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      smoothD += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next.y}`;
    }
    const smoothArea = `${smoothD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

    return { 
      straightLinePath: straightD, 
      straightAreaPath: straightArea,
      smoothLinePath: smoothD, 
      smoothAreaPath: smoothArea, 
      coords: calculatedCoords 
    };
  }, [points, maxVal, minVal]);

  // Current active display point (hovered, clicked/selected, or default)
  const activeData = useMemo(() => {
    if (points.length === 0) return null;
    if (effectiveIndex !== null && points[effectiveIndex]) return points[effectiveIndex];
    return points[points.length - 1];
  }, [points, effectiveIndex]);

  const activeCoord = useMemo(() => {
    if (coords.length === 0) return null;
    if (effectiveIndex !== null && coords[effectiveIndex]) return coords[effectiveIndex];
    return coords[coords.length - 1];
  }, [coords, effectiveIndex]);

  // Compute percentage change between active and preceding point
  const statsSummary = useMemo(() => {
    if (points.length < 2) return { change: 0, isPositive: true, diff: 0, compLabel: '' };
    const currentIndex = effectiveIndex !== null ? effectiveIndex : points.length - 1;
    const currentVal = points[currentIndex]?.amount || 0;

    let prevVal = 0;
    let compLabel = '';
    if (currentIndex > 0) {
      prevVal = points[currentIndex - 1]?.amount || 0;
      compLabel = `vs ${points[currentIndex - 1]?.label || 'prev'}`;
    } else {
      prevVal = points[0]?.amount || 0;
      compLabel = 'baseline';
    }

    const diff = currentVal - prevVal;
    let change = 0;
    if (prevVal > 0) {
      change = (diff / prevVal) * 100;
    } else if (currentVal > 0) {
      change = 100;
    }

    return {
      change,
      isPositive: change >= 0,
      diff,
      compLabel,
      isInspecting: effectiveIndex !== null
    };
  }, [points, effectiveIndex]);

  // Handle Mouse Move for Scrubber
  const handleMouseMove = (e) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

    // Find nearest point
    let closestIndex = 0;
    let minDistance = Infinity;

    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    });

    setHoverIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const handleSvgClick = () => {
    if (hoverIndex !== null) {
      setSelectedIndex(selectedIndex === hoverIndex ? null : hoverIndex);
    }
  };

  // Gridline step values
  const yTicks = [
    { val: maxVal, y: getY(maxVal) },
    { val: maxVal * 0.75, y: getY(maxVal * 0.75) },
    { val: maxVal * 0.5, y: getY(maxVal * 0.5) },
    { val: maxVal * 0.25, y: getY(maxVal * 0.25) },
    { val: 0, y: getY(0) }
  ];

  const strokeColor = '#10B981';

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {/* Top Telemetry & Price Header (Stock Market Style) */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.01em' }}>
              {title}
            </h3>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
              MONTHLY TREND
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
            {subtext}
          </p>
        </div>

        {/* Chart View Switcher */}
        <div style={{
          display: 'flex',
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          borderRadius: '7px',
          padding: '2px',
          gap: '2px'
        }}>
          <button
            onClick={() => setChartType('line')}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: '700',
              border: 'none',
              background: chartType === 'line' ? '#FFFFFF' : 'transparent',
              color: chartType === 'line' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              boxShadow: chartType === 'line' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Line Chart
          </button>
          <button
            onClick={() => setChartType('candles')}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: '700',
              border: 'none',
              background: chartType === 'candles' ? '#FFFFFF' : 'transparent',
              color: chartType === 'candles' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              boxShadow: chartType === 'candles' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('smooth')}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: '700',
              border: 'none',
              background: chartType === 'smooth' ? '#FFFFFF' : 'transparent',
              color: chartType === 'smooth' ? '#0F172A' : '#64748B',
              cursor: 'pointer',
              boxShadow: chartType === 'smooth' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Smooth Curve
          </button>
        </div>
      </div>

      {/* Stock Ticker Value Ribbon */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.85rem',
        marginBottom: '0.75rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #F1F5F9'
      }}>
        {effectiveIndex !== null ? (
          // Scrubbing / Inspected Monthly Point State
          <>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1
            }}>
              {activeData ? formatCurrency(activeData.amount) : '₹0'}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: statsSummary.isPositive ? '#16A34A' : '#DC2626'
            }}>
              {statsSummary.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>
                {statsSummary.diff >= 0 ? `+${formatCurrency(statsSummary.diff)}` : formatCurrency(statsSummary.diff)} ({statsSummary.change.toFixed(1)}%)
              </span>
              <span style={{ fontSize: '0.75rem', color: '#0284C7', background: '#F0F9FF', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '600', marginLeft: '0.2rem' }}>
                MoM {statsSummary.compLabel} • {activeData?.fullLabel} {selectedIndex !== null && hoverIndex === null ? '(Selected Month)' : '(Inspecting)'}
              </span>
              {selectedIndex !== null && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.45rem',
                    cursor: 'pointer',
                    color: '#475569',
                    marginLeft: '0.3rem',
                    fontWeight: '600'
                  }}
                  title="Reset to full period summary"
                >
                  ✕ Reset to Full Period
                </button>
              )}
            </div>
          </>
        ) : (
          // Default / Cumulative Period State
          <>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1
            }}>
              {periodTotal !== null ? formatCurrency(periodTotal) : (activeData ? formatCurrency(activeData.amount) : '₹0')}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              fontWeight: '700'
            }}>
              {periodDelta !== null ? (
                <span style={{ color: periodDelta >= 0 ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {periodDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {periodDelta >= 0 ? `+${periodDelta.toFixed(1)}%` : `${periodDelta.toFixed(1)}%`} vs {periodDeltaLabel || 'baseline'}
                </span>
              ) : (
                <span style={{ color: '#64748B', fontWeight: '600' }}>
                  {periodDeltaLabel ? `No spend recorded in ${periodDeltaLabel}` : (periodLabel ? `${periodLabel}` : '')}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '500', marginLeft: '0.3rem' }}>
                • {periodLabel ? `${periodLabel} (Cumulative)` : (activeData?.fullLabel || 'Current')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Interactive Stock Market SVG Surface */}
      {points.length === 0 ? (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
          No transaction trajectory points to display.
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleSvgClick}
          >
            <defs>
              {/* Vibrant Stock Market Area Gradient */}
              <linearGradient id="stockAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#10B981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>

              {/* Bar Gradients for Candle/Bar Mode */}
              <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="barGradientInactive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              {/* Glowing Pulse Shadow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#10B981" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Dotted Price Levels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={svgWidth - padRight}
                  y2={tick.y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={svgWidth - padRight + 8}
                  y={tick.y + 3.5}
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="var(--font-main)"
                  fontWeight="600"
                >
                  {tick.val >= 1000 ? `₹${(tick.val / 1000).toFixed(0)}k` : `₹${tick.val.toFixed(0)}`}
                </text>
              </g>
            ))}

            {/* CHART TYPE 1: Straight Point-to-Point Line (Default: discrete monthly totals) */}
            {chartType === 'line' && (
              <>
                <path
                  d={straightAreaPath}
                  fill="url(#stockAreaGradient)"
                  style={{ transition: 'all 0.3s ease' }}
                />
                <path
                  d={straightLinePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                {coords.map((c, i) => {
                  const isInspected = effectiveIndex === i;
                  return (
                    <g key={i}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isInspected ? 6.5 : 4}
                        fill={selectedIndex === i ? '#10B981' : '#FFFFFF'}
                        stroke={selectedIndex === i ? '#FFFFFF' : strokeColor}
                        strokeWidth={isInspected ? 3 : 2.5}
                        style={{ transition: 'all 0.15s ease' }}
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* CHART TYPE 3: Smooth Spline Curve */}
            {chartType === 'smooth' && (
              <>
                <path
                  d={smoothAreaPath}
                  fill="url(#stockAreaGradient)"
                  style={{ transition: 'all 0.3s ease' }}
                />
                <path
                  d={smoothLinePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                {coords.map((c, i) => {
                  const isInspected = effectiveIndex === i;
                  return (
                    <g key={i}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isInspected ? 6.5 : 3.5}
                        fill={selectedIndex === i ? '#10B981' : '#FFFFFF'}
                        stroke={selectedIndex === i ? '#FFFFFF' : strokeColor}
                        strokeWidth={isInspected ? 3 : 2}
                        style={{ transition: 'all 0.15s ease' }}
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* CHART TYPE 2: Volume Bars Mode */}
            {chartType === 'candles' && (
              <g>
                {coords.map((c, i) => {
                  const barWidth = Math.min(36, (chartWidth / coords.length) * 0.55);
                  const barHeight = Math.max(6, padTop + chartHeight - c.y);
                  const isBarActive = effectiveIndex === i;

                  return (
                    <g key={i}>
                      {/* Candlestick High-Low Wick */}
                      <line
                        x1={c.x}
                        y1={Math.max(padTop, c.y - 12)}
                        x2={c.x}
                        y2={padTop + chartHeight}
                        stroke={isBarActive ? '#10B981' : '#CBD5E1'}
                        strokeWidth="1.5"
                      />
                      {/* Candlestick Body */}
                      <rect
                        x={c.x - barWidth / 2}
                        y={c.y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={isBarActive ? 'url(#barGradientActive)' : 'url(#barGradientInactive)'}
                        style={{ transition: 'all 0.2s ease' }}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Interactive Vertical Scrubber Crosshair (Displayed only when inspecting or selecting a month) */}
            {effectiveIndex !== null && activeCoord && (
              <g>
                <line
                  x1={activeCoord.x}
                  y1={padTop}
                  x2={activeCoord.x}
                  y2={padTop + chartHeight}
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* Outer Pulsing Aura */}
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="12"
                  fill="rgba(16, 185, 129, 0.2)"
                />
                {/* Center Solid Dot */}
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* X-Axis Timeline Month Labels */}
            {coords.map((c, i) => {
              const isHovered = hoverIndex === i || (hoverIndex === null && i === coords.length - 1);
              return (
                <text
                  key={i}
                  x={c.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fill={isHovered ? '#0F172A' : '#64748B'}
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '500'}
                  fontFamily="var(--font-main)"
                >
                  {c.data.label}
                </text>
              );
            })}
          </svg>

          {/* Floating Crosshair Price Tooltip Pill */}
          {activeCoord && hoverIndex !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${(activeCoord.x / svgWidth) * 100}%`,
                top: `${(activeCoord.y / svgHeight) * 100}%`,
                transform: 'translate(-50%, -125%)',
                background: '#0F172A',
                color: '#FFFFFF',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.3)',
                whiteSpace: 'nowrap',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px'
              }}
            >
              <span>{formatCurrency(activeData.amount)}</span>
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: '500' }}>
                {activeData.fullLabel}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
